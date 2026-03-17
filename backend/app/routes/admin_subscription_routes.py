"""
Admin Subscription Management Routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.admin_middleware import require_admin
from firebase_admin import firestore
from datetime import datetime, timezone

admin_subscription_bp = Blueprint('admin_subscriptions', __name__, url_prefix='/api/admin/subscriptions')

@admin_subscription_bp.route('', methods=['GET'])
@require_admin
def get_all_subscriptions(current_user):
    """Get all subscriptions with user details"""
    try:
        from firebase_admin import auth
        db = firestore.client()
        
        page = int(request.args.get('page', 1))
        per_page = 20
        
        # Get all subscriptions
        subs_query = db.collection('subscriptions').stream()
        all_subs = []
        
        for sub in subs_query:
            sub_data = sub.to_dict()
            sub_data['id'] = sub.id
            
            # Get user details
            try:
                user = auth.get_user(sub_data['userId'])
                sub_data['userEmail'] = user.email
                sub_data['userName'] = user.display_name or user.email.split('@')[0]
            except:
                sub_data['userEmail'] = 'Unknown'
                sub_data['userName'] = 'Unknown'
            
            all_subs.append(sub_data)
        
        # Pagination
        total = len(all_subs)
        start = (page - 1) * per_page
        end = start + per_page
        paginated = all_subs[start:end]
        
        return jsonify({
            'subscriptions': paginated,
            'total': total,
            'page': page,
            'pages': (total + per_page - 1) // per_page
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_subscription_bp.route('/stats', methods=['GET'])
@require_admin
def get_subscription_stats(current_user):
    """Get subscription statistics"""
    try:
        db = firestore.client()
        
        subs = list(db.collection('subscriptions').stream())
        
        stats = {
            'total': len(subs),
            'active': 0,
            'expired': 0,
            'cancelled': 0,
            'byPlan': {'free': 0, 'pro': 0, 'enterprise': 0},
            'totalRevenue': 0,
            'monthlyRecurring': 0
        }
        
        # Count subscriptions by status and plan
        for sub in subs:
            data = sub.to_dict()
            status = data.get('status', 'active')
            plan_id = data.get('planId', 'free')
            
            # Count by status
            if status == 'active':
                stats['active'] += 1
            elif status == 'expired':
                stats['expired'] += 1
            elif status == 'cancelled':
                stats['cancelled'] += 1
            
            # Count by plan
            if plan_id in stats['byPlan']:
                stats['byPlan'][plan_id] += 1
            
            # Calculate monthly recurring revenue (only for active subscriptions)
            if status == 'active':
                if plan_id == 'pro':
                    stats['monthlyRecurring'] += 140
                elif plan_id == 'enterprise':
                    stats['monthlyRecurring'] += 999
            
            # Calculate total revenue from subscriptions with payment IDs
            if data.get('paymentId'):
                if plan_id == 'pro':
                    stats['totalRevenue'] += 140
                elif plan_id == 'enterprise':
                    stats['totalRevenue'] += 999
        
        # Try to get more accurate revenue from payment_orders collection
        try:
            payment_orders = list(db.collection('payment_orders')
                                .where('status', '==', 'paid')
                                .where('type', '==', 'subscription')
                                .stream())
            
            if payment_orders:
                # Use actual payment data if available
                payment_revenue = 0
                for payment in payment_orders:
                    payment_data = payment.to_dict()
                    amount = payment_data.get('amount', 0)
                    payment_revenue += amount / 100  # Convert paise to rupees
                
                if payment_revenue > 0:
                    stats['totalRevenue'] = payment_revenue
        except Exception as e:
            print(f"Error getting payment orders: {str(e)}")
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_subscription_bp.route('/<subscription_id>', methods=['PUT'])
@require_admin
def update_subscription(current_user, subscription_id):
    """Update subscription (change plan, extend, etc.)"""
    try:
        db = firestore.client()
        data = request.get_json()
        
        sub_ref = db.collection('subscriptions').document(subscription_id)
        if not sub_ref.get().exists:
            return jsonify({'message': 'Subscription not found'}), 404
        
        update_data = {}
        if 'status' in data:
            update_data['status'] = data['status']
        if 'planId' in data:
            update_data['planId'] = data['planId']
        if 'endDate' in data:
            update_data['endDate'] = data['endDate']
        
        sub_ref.update(update_data)
        
        return jsonify({'message': 'Subscription updated', 'subscription': update_data}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_subscription_bp.route('/<subscription_id>/cancel', methods=['POST'])
@require_admin
def cancel_subscription(current_user, subscription_id):
    """Cancel a subscription"""
    try:
        db = firestore.client()
        
        sub_ref = db.collection('subscriptions').document(subscription_id)
        if not sub_ref.get().exists:
            return jsonify({'message': 'Subscription not found'}), 404
        
        sub_ref.update({
            'status': 'cancelled',
            'cancelledAt': datetime.now(timezone.utc),
            'cancelledBy': current_user['email']
        })
        
        return jsonify({'message': 'Subscription cancelled'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_subscription_bp.route('/usage', methods=['GET'])
@require_admin
def get_usage_stats(current_user):
    """Get platform-wide usage statistics"""
    try:
        db = firestore.client()
        
        subs = list(db.collection('subscriptions').where('status', '==', 'active').stream())
        
        usage = {
            'totalAnalyses': 0,
            'totalBatchRows': 0,
            'totalApiRequests': 0,
            'averageUsage': {
                'analyses': 0,
                'batchRows': 0,
                'apiRequests': 0
            }
        }
        
        for sub in subs:
            data = sub.to_dict()
            usage['totalAnalyses'] += data.get('usedAnalyses', 0)
            usage['totalBatchRows'] += data.get('usedBatchRows', 0)
            usage['totalApiRequests'] += data.get('usedApiRequests', 0)
        
        if len(subs) > 0:
            usage['averageUsage']['analyses'] = usage['totalAnalyses'] // len(subs)
            usage['averageUsage']['batchRows'] = usage['totalBatchRows'] // len(subs)
            usage['averageUsage']['apiRequests'] = usage['totalApiRequests'] // len(subs)
        
        return jsonify(usage), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_subscription_bp.route('/plans/update', methods=['PUT'])
@require_admin
def update_plan_limits(current_user):
    """Update plan limits (for admin configuration)"""
    try:
        data = request.get_json()
        plan_id = data.get('planId')
        limits = data.get('limits')
        
        if not plan_id or not limits:
            return jsonify({'message': 'Plan ID and limits required'}), 400
        
        # Store in Firestore for dynamic configuration
        db = firestore.client()
        db.collection('plan_configs').document(plan_id).set({
            'limits': limits,
            'updatedBy': current_user['email'],
            'updatedAt': datetime.now(timezone.utc)
        }, merge=True)
        
        return jsonify({'message': 'Plan limits updated', 'planId': plan_id, 'limits': limits}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_subscription_bp.route('/<subscription_id>/extend', methods=['POST'])
@require_admin
def extend_subscription(current_user, subscription_id):
    """Extend subscription end date"""
    try:
        from datetime import timedelta
        db = firestore.client()
        data = request.get_json()
        days = data.get('days', 30)
        
        sub_ref = db.collection('subscriptions').document(subscription_id)
        sub = sub_ref.get()
        
        if not sub.exists:
            return jsonify({'message': 'Subscription not found'}), 404
        
        sub_data = sub.to_dict()
        current_end = sub_data.get('endDate')
        
        if current_end:
            new_end = current_end + timedelta(days=days)
        else:
            new_end = datetime.now(timezone.utc) + timedelta(days=days)
        
        sub_ref.update({
            'endDate': new_end,
            'extendedBy': current_user['email'],
            'extendedAt': datetime.now(timezone.utc)
        })
        
        return jsonify({'message': f'Subscription extended by {days} days', 'newEndDate': new_end.isoformat()}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_subscription_bp.route('/send-renewal-reminders', methods=['POST'])
@require_admin
def send_renewal_reminders(current_user):
    """Send renewal reminders to expiring subscriptions"""
    try:
        from datetime import timedelta
        from firebase_admin import auth
        from app.services.email_service import send_renewal_reminder
        
        db = firestore.client()
        now = datetime.now(timezone.utc)
        reminder_date = now + timedelta(days=7)  # 7 days before expiry
        
        # Find subscriptions expiring in 7 days
        subs = db.collection('subscriptions')\
            .where('status', '==', 'active')\
            .where('endDate', '<=', reminder_date)\
            .where('endDate', '>=', now)\
            .stream()
        
        sent_count = 0
        for sub in subs:
            sub_data = sub.to_dict()
            try:
                user = auth.get_user(sub_data['userId'])
                send_renewal_reminder(
                    user.email,
                    user.display_name or 'User',
                    sub_data['planName'],
                    sub_data['endDate'].strftime('%Y-%m-%d')
                )
                sent_count += 1
            except Exception as e:
                print(f"Failed to send reminder to {sub_data['userId']}: {str(e)}")
        
        return jsonify({'message': f'Sent {sent_count} renewal reminders'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_subscription_bp.route('/unified', methods=['GET'])
@require_admin
def get_unified_subscriptions(current_user):
    """Get both platform and API subscriptions unified"""
    try:
        from firebase_admin import auth
        db = firestore.client()
        
        # Get platform subscriptions
        platform_subs = list(db.collection('subscriptions').stream())
        
        # Get API subscriptions
        api_subs = list(db.collection('api_subscriptions').stream())
        
        all_subscriptions = []
        
        # Process platform subscriptions
        for sub in platform_subs:
            sub_data = sub.to_dict()
            sub_data['id'] = sub.id
            sub_data['type'] = 'platform'
            
            # Get user details
            try:
                user = auth.get_user(sub_data['userId'])
                sub_data['userEmail'] = user.email
                sub_data['userName'] = user.display_name or user.email.split('@')[0]
            except:
                sub_data['userEmail'] = 'Unknown'
                sub_data['userName'] = 'Unknown'
            
            all_subscriptions.append(sub_data)
        
        # Process API subscriptions
        for sub in api_subs:
            sub_data = sub.to_dict()
            sub_data['id'] = sub.id
            sub_data['type'] = 'api'
            
            # Get user details
            try:
                user = auth.get_user(sub_data['userId'])
                sub_data['userEmail'] = user.email
                sub_data['userName'] = user.display_name or user.email.split('@')[0]
            except:
                sub_data['userEmail'] = 'Unknown'
                sub_data['userName'] = 'Unknown'
            
            # Normalize API subscription data to match platform format
            sub_data['usedAnalyses'] = 0  # API subs don't have analysis usage
            sub_data['usedApiRequests'] = sub_data.get('requestsUsed', 0)
            sub_data['limits'] = {
                'analyses_per_month': 0,
                'api_requests_per_month': sub_data.get('requestsLimit', 0)
            }
            
            all_subscriptions.append(sub_data)
        
        return jsonify({
            'subscriptions': all_subscriptions,
            'total': len(all_subscriptions)
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_subscription_bp.route('/unified-stats', methods=['GET'])
@require_admin
def get_unified_stats(current_user):
    """Get unified statistics for both platform and API subscriptions"""
    try:
        db = firestore.client()
        
        # Get platform subscriptions
        platform_subs = list(db.collection('subscriptions').stream())
        
        # Get API subscriptions
        api_subs = list(db.collection('api_subscriptions').stream())
        
        stats = {
            'total': len(platform_subs) + len(api_subs),
            'active': 0,
            'expired': 0,
            'cancelled': 0,
            'byPlan': {'free': 0, 'pro': 0, 'enterprise': 0, 'api_free': 0, 'api_starter': 0, 'api_professional': 0},
            'totalRevenue': 0,
            'monthlyRecurring': 0,
            'platform': {
                'total': len(platform_subs),
                'active': 0,
                'revenue': 0
            },
            'api': {
                'total': len(api_subs),
                'active': 0,
                'revenue': 0
            }
        }
        
        # Process platform subscriptions
        for sub in platform_subs:
            data = sub.to_dict()
            status = data.get('status', 'active')
            plan_id = data.get('planId', 'free')
            
            if status == 'active':
                stats['active'] += 1
                stats['platform']['active'] += 1
            elif status == 'expired':
                stats['expired'] += 1
            elif status == 'cancelled':
                stats['cancelled'] += 1
            
            if plan_id in stats['byPlan']:
                stats['byPlan'][plan_id] += 1
            
            # Calculate revenue
            if status == 'active':
                if plan_id == 'pro':
                    stats['monthlyRecurring'] += 140
                    stats['platform']['revenue'] += 140
                elif plan_id == 'enterprise':
                    stats['monthlyRecurring'] += 999
                    stats['platform']['revenue'] += 999
            
            if data.get('paymentId'):
                if plan_id == 'pro':
                    stats['totalRevenue'] += 140
                elif plan_id == 'enterprise':
                    stats['totalRevenue'] += 999
        
        # Process API subscriptions
        for sub in api_subs:
            data = sub.to_dict()
            status = data.get('status', 'active')
            plan_id = f"api_{data.get('planId', 'free')}"
            
            if status == 'active':
                stats['active'] += 1
                stats['api']['active'] += 1
            elif status == 'expired':
                stats['expired'] += 1
            elif status == 'cancelled':
                stats['cancelled'] += 1
            
            if plan_id in stats['byPlan']:
                stats['byPlan'][plan_id] += 1
            
            # Calculate API revenue
            if status == 'active':
                api_plan = data.get('planId', 'free')
                if api_plan == 'starter':
                    stats['monthlyRecurring'] += 499
                    stats['api']['revenue'] += 499
                elif api_plan == 'professional':
                    stats['monthlyRecurring'] += 1499
                    stats['api']['revenue'] += 1499
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
@admin_subscription_bp.route('/reset-usage/<subscription_id>', methods=['POST'])
@require_admin
def reset_usage(current_user, subscription_id):
    """Reset usage counters for a subscription"""
    try:
        db = firestore.client()
        
        sub_ref = db.collection('subscriptions').document(subscription_id)
        if not sub_ref.get().exists:
            return jsonify({'message': 'Subscription not found'}), 404
        
        sub_ref.update({
            'usedAnalyses': 0,
            'usedBatchRows': 0,
            'usedApiRequests': 0,
            'usageResetBy': current_user['email'],
            'usageResetAt': datetime.now(timezone.utc)
        })
        
        return jsonify({'message': 'Usage counters reset'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400
