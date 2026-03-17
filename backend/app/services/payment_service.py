"""
Razorpay Payment Service
Handles subscriptions, credit purchases, and payment verification
"""
import razorpay
from app.config import Config
from firebase_admin import firestore
from datetime import datetime, timezone, timedelta

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(Config.RAZORPAY_KEY_ID, Config.RAZORPAY_KEY_SECRET))

def get_db():
    return firestore.client()

# Default plan definitions (used as fallback if Firestore has no overrides)
DEFAULT_PLANS = {
    'free': {
        'name': 'Free',
        'price': 0,
        'currency': 'INR',
        'interval': 'forever',
        'features': {
            'ingredient_analysis': True, 'allergen_detection': True, 'clean_label_score': True,
            'health_risk_score': True, 'nutrition_lookup': True, 'additive_database': True,
            'ml_category_prediction': False, 'batch_analysis': False, 'api_access': False,
            'similarity_search': False, 'brand_prediction': False, 'export_reports': False,
            'webhooks': False, 'reformulation_detection': False, 'embedding_explorer': False
        },
        'limits': {
            'analyses_per_month': 50, 'batch_rows_per_month': 0,
            'api_requests_per_month': 0, 'rate_limit_per_minute': 5
        }
    },
    'pro': {
        'name': 'Pro',
        'price': 14900,
        'currency': 'INR',
        'interval': 'month',
        'features': {
            'ingredient_analysis': True, 'allergen_detection': True, 'clean_label_score': True,
            'health_risk_score': True, 'nutrition_lookup': True, 'additive_database': True,
            'ml_category_prediction': True, 'batch_analysis': True, 'api_access': True,
            'similarity_search': True, 'brand_prediction': True, 'export_reports': True,
            'webhooks': True, 'reformulation_detection': True, 'embedding_explorer': True
        },
        'limits': {
            'analyses_per_month': 5000, 'batch_rows_per_month': 5000,
            'api_requests_per_month': 10000, 'rate_limit_per_minute': 60
        }
    },
    'enterprise': {
        'name': 'Enterprise',
        'price': 0,
        'currency': 'INR',
        'interval': 'custom',
        'features': {
            'ingredient_analysis': True, 'allergen_detection': True, 'clean_label_score': True,
            'health_risk_score': True, 'nutrition_lookup': True, 'additive_database': True,
            'ml_category_prediction': True, 'batch_analysis': True, 'api_access': True,
            'similarity_search': True, 'brand_prediction': True, 'export_reports': True,
            'webhooks': True, 'reformulation_detection': True, 'embedding_explorer': True
        },
        'limits': {
            'analyses_per_month': -1, 'batch_rows_per_month': -1,
            'api_requests_per_month': -1, 'rate_limit_per_minute': 120
        },
        'contact_sales': True
    }
}

def get_plans():
    """Get plans with Firestore overrides applied on top of defaults."""
    import copy
    plans = copy.deepcopy(DEFAULT_PLANS)
    try:
        db = get_db()
        overrides = db.collection('platform_plan_configs').stream()
        for doc in overrides:
            plan_id = doc.id
            if plan_id in plans:
                data = doc.to_dict()
                if 'price' in data:
                    plans[plan_id]['price'] = data['price']
                if 'limits' in data:
                    plans[plan_id]['limits'].update(data['limits'])
    except Exception:
        pass
    return plans

# Keep PLANS as a property for backward compat — always reads live
PLANS = DEFAULT_PLANS

def create_subscription_order(user_id, plan_id):
    """Create Razorpay order for subscription"""
    try:
        plans = get_plans()
        if plan_id not in plans:
            raise Exception('Invalid plan')
        
        plan = plans[plan_id]
        
        if plan['price'] == 0:
            # Free plan - no payment needed
            return activate_subscription(user_id, plan_id, None)
        
        # Create Razorpay order
        timestamp = int(datetime.now().timestamp())
        order_data = {
            'amount': plan['price'],
            'currency': 'INR',
            'receipt': f'sub_{timestamp}',
            'notes': {
                'user_id': user_id,
                'plan_id': plan_id,
                'type': 'subscription'
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        # Save order to Firestore
        db = get_db()
        db.collection('payment_orders').document(order['id']).set({
            'orderId': order['id'],
            'userId': user_id,
            'planId': plan_id,
            'amount': plan['price'],
            'currency': 'INR',
            'status': 'created',
            'type': 'subscription',
            'createdAt': datetime.now(timezone.utc)
        })
        
        return {
            'orderId': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'keyId': Config.RAZORPAY_KEY_ID,
            'plan': plan
        }
    except Exception as e:
        raise Exception(f'Failed to create order: {str(e)}')

def create_credit_order(user_id, package_id):
    """Create Razorpay order for credit purchase"""
    try:
        if package_id not in CREDIT_PACKAGES:
            raise Exception('Invalid package')
        
        package = CREDIT_PACKAGES[package_id]
        
        timestamp = int(datetime.now().timestamp())
        order_data = {
            'amount': package['price'],
            'currency': 'INR',
            'receipt': f'crd_{timestamp}',
            'notes': {
                'user_id': user_id,
                'package_id': package_id,
                'credits': package['credits'],
                'type': 'credits'
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        db = get_db()
        db.collection('payment_orders').document(order['id']).set({
            'orderId': order['id'],
            'userId': user_id,
            'packageId': package_id,
            'credits': package['credits'],
            'amount': package['price'],
            'currency': 'INR',
            'status': 'created',
            'type': 'credits',
            'createdAt': datetime.now(timezone.utc)
        })
        
        return {
            'orderId': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'keyId': Config.RAZORPAY_KEY_ID,
            'package': package
        }
    except Exception as e:
        raise Exception(f'Failed to create order: {str(e)}')

def verify_payment(order_id, payment_id, signature):
    """Verify Razorpay payment signature"""
    try:
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get order details
        db = get_db()
        order_doc = db.collection('payment_orders').document(order_id).get()
        
        if not order_doc.exists:
            raise Exception('Order not found')
        
        order_data = order_doc.to_dict()
        
        # Update order status
        db.collection('payment_orders').document(order_id).update({
            'status': 'paid',
            'paymentId': payment_id,
            'paidAt': datetime.now(timezone.utc)
        })
        
        # Process based on type
        if order_data['type'] == 'subscription':
            return activate_subscription(order_data['userId'], order_data['planId'], payment_id)
        elif order_data['type'] == 'credits':
            return add_credits(order_data['userId'], order_data['credits'], payment_id)
        
        return {'success': True}
    except Exception as e:
        raise Exception(f'Payment verification failed: {str(e)}')

def activate_subscription(user_id, plan_id, payment_id):
    """Activate subscription for user"""
    try:
        db = get_db()
        plans = get_plans()
        plan = plans[plan_id]
        
        # Create/update subscription
        subscription_data = {
            'userId': user_id,
            'planId': plan_id,
            'planName': plan['name'],
            'status': 'active',
            'features': plan['features'],
            'limits': plan['limits'],
            'usedAnalyses': 0,
            'usedBatchRows': 0,
            'usedApiRequests': 0,
            'startDate': datetime.now(timezone.utc),
            'endDate': datetime.now(timezone.utc) + timedelta(days=30) if plan['interval'] == 'month' else None,
            'paymentId': payment_id,
            'autoRenew': plan['interval'] == 'month',
            'updatedAt': datetime.now(timezone.utc)
        }
        
        # Find ANY existing subscription for this user (active or cancelled)
        existing_subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .stream()
        
        # Cancel all old subscriptions and reuse the first one
        first_sub_id = None
        for sub in existing_subs:
            if not first_sub_id:
                first_sub_id = sub.id
                # Update the first subscription
                db.collection('subscriptions').document(sub.id).update(subscription_data)
            else:
                # Mark others as cancelled to avoid duplicates
                db.collection('subscriptions').document(sub.id).update({
                    'status': 'cancelled',
                    'cancelledAt': datetime.now(timezone.utc)
                })
        
        if first_sub_id:
            subscription_data['id'] = first_sub_id
        else:
            # No existing subscription - create new
            doc_ref = db.collection('subscriptions').add(subscription_data)
            subscription_data['id'] = doc_ref[1].id
        
        # Update user document
        db.collection('users').document(user_id).set({
            'subscription': plan_id,
            'subscriptionStatus': 'active'
        }, merge=True)
        
        # Send payment receipt email
        if payment_id:
            try:
                from firebase_admin import auth
                from app.services.email_service import send_payment_receipt
                user = auth.get_user(user_id)
                
                # Get order_id from payment_orders collection
                order_id = None
                try:
                    orders = db.collection('payment_orders')\
                        .where('paymentId', '==', payment_id)\
                        .limit(1)\
                        .stream()
                    order = next(orders, None)
                    if order:
                        order_id = order.to_dict().get('orderId')
                except:
                    pass
                
                send_payment_receipt(
                    user.email,
                    user.display_name or 'User',
                    plan['name'],
                    plan['price'] / 100,
                    payment_id,
                    subscription_data['startDate'].strftime('%Y-%m-%d'),
                    subscription_data['endDate'].strftime('%Y-%m-%d') if subscription_data['endDate'] else 'Lifetime',
                    order_id
                )
            except Exception as e:
                print(f'Failed to send receipt email: {str(e)}')
        
        return {
            'success': True,
            'subscription': subscription_data
        }
    except Exception as e:
        raise Exception(f'Failed to activate subscription: {str(e)}')

def add_credits(user_id, credits, payment_id):
    """Add credits to user account"""
    try:
        db = get_db()
        
        # Get current subscription
        subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if sub:
            # Add to existing subscription
            sub_ref = db.collection('subscriptions').document(sub.id)
            sub_ref.update({
                'credits': firestore.Increment(credits)
            })
        else:
            # Create credit-only subscription
            db.collection('subscriptions').add({
                'userId': user_id,
                'planId': 'credits_only',
                'status': 'active',
                'credits': credits,
                'usedCredits': 0,
                'createdAt': datetime.now(timezone.utc),
                'paymentId': payment_id
            })
        
        # Log credit purchase
        db.collection('credit_transactions').add({
            'userId': user_id,
            'credits': credits,
            'type': 'purchase',
            'paymentId': payment_id,
            'createdAt': datetime.now(timezone.utc)
        })
        
        return {
            'success': True,
            'credits': credits
        }
    except Exception as e:
        raise Exception(f'Failed to add credits: {str(e)}')

def check_usage_limit(user_id, usage_type='analysis'):
    """Check if user has remaining usage quota"""
    try:
        db = get_db()
        
        # Get active subscription
        subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if not sub:
            # No subscription - deny access
            return {'allowed': False, 'reason': 'No active subscription. Please subscribe to continue.'}
        
        sub_data = sub.to_dict()
        limits = sub_data.get('limits', {})
        
        if usage_type == 'analysis':
            limit = limits.get('analyses_per_month', 0)
            used = sub_data.get('usedAnalyses', 0)
            if limit == -1:  # Unlimited
                return {'allowed': True, 'remaining': -1}
            remaining = limit - used
            if remaining <= 0:
                return {'allowed': False, 'reason': 'Monthly analysis limit reached. Please upgrade your plan.'}
            return {'allowed': True, 'remaining': remaining}
        
        elif usage_type == 'batch':
            limit = limits.get('batch_rows_per_month', 0)
            used = sub_data.get('usedBatchRows', 0)
            if limit == -1:
                return {'allowed': True, 'remaining': -1}
            if limit == 0:
                return {'allowed': False, 'reason': 'Batch analysis not available in your plan. Please upgrade.'}
            remaining = limit - used
            if remaining <= 0:
                return {'allowed': False, 'reason': 'Monthly batch limit reached. Please upgrade your plan.'}
            return {'allowed': True, 'remaining': remaining}
        
        elif usage_type == 'api':
            limit = limits.get('api_requests_per_month', 0)
            used = sub_data.get('usedApiRequests', 0)
            if limit == -1:
                return {'allowed': True, 'remaining': -1}
            if limit == 0:
                return {'allowed': False, 'reason': 'API access not available in your plan. Please upgrade.'}
            remaining = limit - used
            if remaining <= 0:
                return {'allowed': False, 'reason': 'Monthly API limit reached. Please upgrade your plan.'}
            return {'allowed': True, 'remaining': remaining}
        
        return {'allowed': True, 'remaining': 999}
    except Exception as e:
        print(f'Usage check error: {str(e)}')
        return {'allowed': True, 'remaining': 999}  # Allow on error

def consume_usage(user_id, usage_type='analysis', amount=1):
    """Consume usage quota"""
    try:
        db = get_db()
        
        subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if sub:
            sub_ref = db.collection('subscriptions').document(sub.id)
            if usage_type == 'analysis':
                sub_ref.update({'usedAnalyses': firestore.Increment(amount)})
            elif usage_type == 'batch':
                sub_ref.update({'usedBatchRows': firestore.Increment(amount)})
            elif usage_type == 'api':
                sub_ref.update({'usedApiRequests': firestore.Increment(amount)})
    except Exception as e:
        print(f'Failed to consume usage: {str(e)}')

def check_feature_access(user_id, feature_name):
    """Check if user has access to a specific feature"""
    try:
        db = get_db()
        
        subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if not sub:
            return False
        
        sub_data = sub.to_dict()
        features = sub_data.get('features', {})
        return features.get(feature_name, False)
    except:
        return False

def get_user_subscription(user_id):
    """Get user's current subscription"""
    try:
        db = get_db()
        
        subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if sub:
            return {'id': sub.id, **sub.to_dict()}
        
        return None
    except:
        return None
