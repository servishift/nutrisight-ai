"""
Admin API Subscription Management Routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.admin_middleware import require_admin
from firebase_admin import firestore, auth
from datetime import datetime, timezone

admin_api_bp = Blueprint('admin_api', __name__, url_prefix='/api/admin/api-subscriptions')

@admin_api_bp.route('/', methods=['GET'])
@require_admin
def get_all_api_subscriptions(current_user):
    """Get all API subscriptions"""
    try:
        db = firestore.client()
        
        subs = db.collection('api_subscriptions').stream()
        subscriptions = []
        
        for sub in subs:
            data = sub.to_dict()
            
            # Get user details
            user_email = "Unknown"
            user_name = "Unknown"
            try:
                user_record = auth.get_user(data['userId'])
                user_email = user_record.email or "Unknown"
                user_name = user_record.display_name or user_email.split('@')[0]
            except:
                pass
            
            subscriptions.append({
                'id': sub.id,
                'userId': data['userId'],
                'userEmail': user_email,
                'userName': user_name,
                'planId': data['planId'],
                'planName': data['planName'],
                'status': data['status'],
                'requestsLimit': data['requestsLimit'],
                'requestsUsed': data['requestsUsed'],
                'requestsRemaining': data['requestsLimit'] - data['requestsUsed'] if data['requestsLimit'] != -1 else -1,
                'rateLimit': data['rateLimit'],
                'startDate': data['startDate'].isoformat(),
                'endDate': data['endDate'].isoformat() if data.get('endDate') else None
            })
        
        return jsonify({'subscriptions': subscriptions}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_api_bp.route('/stats', methods=['GET'])
@require_admin
def get_api_subscription_stats(current_user):
    """Get API subscription statistics"""
    try:
        db = firestore.client()
        
        subs = list(db.collection('api_subscriptions').stream())
        
        total = len(subs)
        active = len([s for s in subs if s.to_dict().get('status') == 'active'])
        
        by_plan = {}
        total_requests = 0
        total_revenue = 0
        
        for sub in subs:
            data = sub.to_dict()
            plan_id = data.get('planId', 'unknown')
            by_plan[plan_id] = by_plan.get(plan_id, 0) + 1
            total_requests += data.get('requestsUsed', 0)
            
            # Calculate revenue (simplified)
            if plan_id == 'starter':
                total_revenue += 499
            elif plan_id == 'professional':
                total_revenue += 1499
        
        return jsonify({
            'total': total,
            'active': active,
            'byPlan': by_plan,
            'totalRequests': total_requests,
            'totalRevenue': total_revenue
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_api_bp.route('/<subscription_id>/cancel', methods=['POST'])
@require_admin
def cancel_api_subscription(current_user, subscription_id):
    """Cancel API subscription"""
    try:
        db = firestore.client()
        
        doc_ref = db.collection('api_subscriptions').document(subscription_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'Subscription not found'}), 404
        
        doc_ref.update({
            'status': 'cancelled',
            'cancelledAt': datetime.now(timezone.utc),
            'cancelledBy': current_user['uid']
        })
        
        return jsonify({'message': 'API subscription cancelled'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_api_bp.route('/<subscription_id>/reset-usage', methods=['POST'])
@require_admin
def reset_api_usage(current_user, subscription_id):
    """Reset API usage counter"""
    try:
        db = firestore.client()
        
        doc_ref = db.collection('api_subscriptions').document(subscription_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'Subscription not found'}), 404
        
        doc_ref.update({
            'requestsUsed': 0,
            'resetAt': datetime.now(timezone.utc),
            'resetBy': current_user['uid']
        })
        
        return jsonify({'message': 'Usage counter reset'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_api_bp.route('/<subscription_id>/extend', methods=['POST'])
@require_admin
def extend_api_subscription(current_user, subscription_id):
    """Extend API subscription"""
    try:
        from datetime import timedelta
        db = firestore.client()
        data = request.get_json()
        days = data.get('days', 30)
        
        doc_ref = db.collection('api_subscriptions').document(subscription_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'Subscription not found'}), 404
        
        sub_data = doc.to_dict()
        current_end = sub_data.get('endDate')
        
        if current_end:
            new_end = current_end + timedelta(days=days)
        else:
            new_end = datetime.now(timezone.utc) + timedelta(days=days)
        
        doc_ref.update({
            'endDate': new_end,
            'extendedAt': datetime.now(timezone.utc),
            'extendedBy': current_user['uid']
        })
        
        return jsonify({
            'message': f'Subscription extended by {days} days',
            'newEndDate': new_end.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
