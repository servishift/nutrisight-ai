"""
API Pricing & Subscription Routes
For developers to purchase API access
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
from firebase_admin import firestore
from datetime import datetime, timezone, timedelta
import razorpay
from app.config import Config

api_pricing_bp = Blueprint('api_pricing', __name__, url_prefix='/api/api-pricing')

# Initialize Razorpay
razorpay_client = razorpay.Client(auth=(Config.RAZORPAY_KEY_ID, Config.RAZORPAY_KEY_SECRET))

# Default API Pricing Plans (Firestore collection 'api_plan_configs' overrides these)
DEFAULT_API_PLANS = {
    'free': {
        'name': 'Free Trial',
        'price': 0,
        'requests': 100,
        'rate_limit': 10,
        'features': ['Category Prediction', 'Similarity Search', 'Brand Prediction', 'Indian Food DB']
    },
    'starter': {
        'name': 'Starter',
        'price': 49900,
        'requests': 10000,
        'rate_limit': 60,
        'features': ['All Free Features', 'Priority Support', 'Higher Rate Limits']
    },
    'professional': {
        'name': 'Professional',
        'price': 149900,
        'requests': 100000,
        'rate_limit': 300,
        'features': ['All Starter Features', 'Webhooks', 'Custom Integration', 'Dedicated Support']
    },
    'enterprise': {
        'name': 'Enterprise',
        'price': 0,
        'requests': -1,
        'rate_limit': 1000,
        'features': ['Unlimited Requests', 'White Label', 'SLA', '24/7 Support', 'Custom Features']
    }
}

def get_api_plans():
    """Get API plans with Firestore overrides applied on top of defaults."""
    import copy
    plans = copy.deepcopy(DEFAULT_API_PLANS)
    try:
        db = firestore.client()
        overrides = db.collection('api_plan_configs').stream()
        for doc in overrides:
            plan_id = doc.id
            if plan_id in plans:
                data = doc.to_dict()
                if 'price' in data:
                    plans[plan_id]['price'] = data['price']
                if 'requests' in data:
                    plans[plan_id]['requests'] = data['requests']
                if 'rate_limit' in data:
                    plans[plan_id]['rate_limit'] = data['rate_limit']
    except Exception:
        pass
    return plans

# backward compat alias
API_PLANS = DEFAULT_API_PLANS

@api_pricing_bp.route('/plans', methods=['GET'])
def get_api_plans_route():
    """Get all API pricing plans (dynamic from Firestore)"""
    return jsonify({'plans': get_api_plans()}), 200

@api_pricing_bp.route('/subscribe', methods=['POST'])
@require_auth
def subscribe_api_plan(current_user):
    """Subscribe to an API plan"""
    try:
        data = request.get_json()
        plan_id = data.get('plan_id')
        
        plans = get_api_plans()
        if plan_id not in plans:
            return jsonify({'error': 'Invalid plan'}), 400
        
        plan = plans[plan_id]
        user_id = current_user['uid']
        
        # Free plan - activate immediately
        if plan['price'] == 0:
            return activate_api_subscription(user_id, plan_id, None)
        
        # Paid plan - create Razorpay order
        timestamp = int(datetime.now().timestamp())
        order_data = {
            'amount': plan['price'],
            'currency': 'INR',
            'receipt': f'api_{timestamp}',
            'notes': {
                'user_id': user_id,
                'plan_id': plan_id,
                'type': 'api_subscription'
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        # Save order
        db = firestore.client()
        db.collection('api_payment_orders').document(order['id']).set({
            'orderId': order['id'],
            'userId': user_id,
            'planId': plan_id,
            'amount': plan['price'],
            'currency': 'INR',
            'status': 'created',
            'type': 'api_subscription',
            'createdAt': datetime.now(timezone.utc)
        })
        
        return jsonify({
            'orderId': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'keyId': Config.RAZORPAY_KEY_ID,
            'plan': plan
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_pricing_bp.route('/verify-payment', methods=['POST'])
@require_auth
def verify_api_payment(current_user):
    """Verify API subscription payment"""
    try:
        data = request.get_json()
        order_id = data.get('orderId')
        payment_id = data.get('paymentId')
        signature = data.get('signature')
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get order details
        db = firestore.client()
        order_doc = db.collection('api_payment_orders').document(order_id).get()
        
        if not order_doc.exists:
            return jsonify({'error': 'Order not found'}), 404
        
        order_data = order_doc.to_dict()
        
        # Update order status
        db.collection('api_payment_orders').document(order_id).update({
            'status': 'paid',
            'paymentId': payment_id,
            'paidAt': datetime.now(timezone.utc)
        })
        
        result = activate_api_subscription(order_data['userId'], order_data['planId'], payment_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def activate_api_subscription(user_id, plan_id, payment_id):
    """Activate API subscription with credit rollover"""
    try:
        db = firestore.client()
        plans = get_api_plans()
        plan = plans[plan_id]
        
        # Check existing subscription
        existing = db.collection('api_subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        existing_sub = next(existing, None)
        
        if existing_sub:
            # User re-subscribing - add credits to existing pool
            existing_data = existing_sub.to_dict()
            current_used = existing_data.get('requestsUsed', 0)
            current_limit = existing_data.get('requestsLimit', 0)
            remaining_credits = max(0, current_limit - current_used) if current_limit != -1 else 0
            
            # Add new plan credits + remaining credits
            new_limit = plan['requests'] if plan['requests'] == -1 else plan['requests'] + remaining_credits
            
            subscription_data = {
                'planId': plan_id,
                'planName': plan['name'],
                'status': 'active',
                'requestsLimit': new_limit,
                'requestsUsed': 0,  # Reset counter, credits rolled over to limit
                'rateLimit': plan['rate_limit'],
                'features': plan['features'],
                'startDate': datetime.now(timezone.utc),
                'endDate': datetime.now(timezone.utc) + timedelta(days=30) if plan['price'] > 0 else None,
                'paymentId': payment_id,
                'autoRenew': plan['price'] > 0,
                'lastNotifiedAt': 0,
                'creditsRolledOver': remaining_credits,
                'upgradedAt': datetime.now(timezone.utc)
            }
            
            db.collection('api_subscriptions').document(existing_sub.id).update(subscription_data)
            subscription_data['id'] = existing_sub.id
            subscription_data['message'] = f'Upgraded! {remaining_credits:,} credits rolled over. Total: {new_limit:,} requests'
        else:
            # New subscription
            subscription_data = {
                'userId': user_id,
                'planId': plan_id,
                'planName': plan['name'],
                'status': 'active',
                'requestsLimit': plan['requests'],
                'requestsUsed': 0,
                'rateLimit': plan['rate_limit'],
                'features': plan['features'],
                'startDate': datetime.now(timezone.utc),
                'endDate': datetime.now(timezone.utc) + timedelta(days=30) if plan['price'] > 0 else None,
                'paymentId': payment_id,
                'autoRenew': plan['price'] > 0,
                'lastNotifiedAt': 0
            }
            
            doc_ref = db.collection('api_subscriptions').add(subscription_data)
            subscription_data['id'] = doc_ref[1].id
        
        # Send confirmation email
        try:
            from firebase_admin import auth
            from app.services.email_service import send_api_subscription_confirmation
            user = auth.get_user(user_id)
            
            send_api_subscription_confirmation(
                user.email,
                user.display_name or 'User',
                plan['name'],
                plan['price'] / 100 if plan['price'] > 0 else 0,
                payment_id,
                plan['requests'],
                plan['rate_limit'],
                subscription_data['startDate'].strftime('%Y-%m-%d'),
                subscription_data['endDate'].strftime('%Y-%m-%d') if subscription_data.get('endDate') else None
            )
        except Exception as e:
            print(f'Failed to send confirmation email: {str(e)}')
        
        return {
            'success': True,
            'subscription': subscription_data,
            'message': f'{plan["name"]} plan activated successfully'
        }
        
    except Exception as e:
        raise Exception(f'Failed to activate subscription: {str(e)}')

@api_pricing_bp.route('/my-subscription', methods=['GET'])
@require_auth
def get_my_api_subscription(current_user):
    """Get user's current API subscription"""
    try:
        db = firestore.client()
        user_id = current_user['uid']
        
        subs = db.collection('api_subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if sub:
            data = sub.to_dict()
            return jsonify({
                'subscription': {
                    'id': sub.id,
                    'planId': data['planId'],
                    'planName': data['planName'],
                    'requestsLimit': data['requestsLimit'],
                    'requestsUsed': data['requestsUsed'],
                    'requestsRemaining': data['requestsLimit'] - data['requestsUsed'] if data['requestsLimit'] != -1 else -1,
                    'rateLimit': data['rateLimit'],
                    'features': data['features'],
                    'status': data['status'],
                    'startDate': data['startDate'].isoformat(),
                    'endDate': data['endDate'].isoformat() if data.get('endDate') else None
                }
            }), 200
        
        return jsonify({'subscription': None}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_pricing_bp.route('/usage', methods=['GET'])
@require_auth
def get_api_usage(current_user):
    """Get API usage statistics"""
    try:
        db = firestore.client()
        user_id = current_user['uid']
        
        # Get user's API keys
        keys = db.collection('api_keys').where('user_id', '==', user_id).stream()
        
        total_requests = 0
        for key in keys:
            data = key.to_dict()
            total_requests += data.get('usage_count', 0)
        
        # Get subscription
        subs = db.collection('api_subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if sub:
            sub_data = sub.to_dict()
            limit = sub_data.get('requestsLimit', 0)
            used = sub_data.get('requestsUsed', 0)
            
            return jsonify({
                'totalRequests': total_requests,
                'requestsUsed': used,
                'requestsLimit': limit,
                'requestsRemaining': limit - used if limit != -1 else -1,
                'planName': sub_data.get('planName')
            }), 200

        # Fallback to platform subscription if no dedicated API subscription exists
        platform_subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        platform_sub = next(platform_subs, None)
        if platform_sub:
            platform_data = platform_sub.to_dict()
            platforms_limits = platform_data.get('limits', {})
            api_limit = platforms_limits.get('api_requests_per_month', 0)
            api_used = platform_data.get('usedApiRequests', platform_data.get('apiRequestsUsed', 0))
            plan_name = platform_data.get('planName') or platform_data.get('planId') or 'Platform'

            return jsonify({
                'totalRequests': total_requests,
                'requestsUsed': api_used,
                'requestsLimit': api_limit,
                'requestsRemaining': api_limit - api_used if api_limit != -1 else -1,
                'planName': plan_name
            }), 200

        return jsonify({
            'totalRequests': total_requests,
            'requestsUsed': 0,
            'requestsLimit': 0,
            'requestsRemaining': 0,
            'planName': 'None'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
