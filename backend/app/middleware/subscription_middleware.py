"""
Subscription Requirement Middleware
Ensures user has an active subscription before accessing features
"""
from functools import wraps
from flask import request, jsonify
from app.services.payment_service import get_user_subscription

def require_subscription(f):
    """Decorator to require active subscription"""
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        try:
            # Check if user has active subscription
            subscription = get_user_subscription(current_user['uid'])
            
            if not subscription:
                return jsonify({
                    'message': 'No active subscription. Please subscribe to continue.',
                    'requiresSubscription': True,
                    'redirectTo': '/pricing'
                }), 403
            
            if subscription.get('status') != 'active':
                return jsonify({
                    'message': 'Your subscription is not active. Please renew.',
                    'requiresSubscription': True,
                    'redirectTo': '/pricing'
                }), 403
            
            # Attach subscription to request for use in route
            request.subscription = subscription
            
            return f(current_user, *args, **kwargs)
            
        except Exception as e:
            return jsonify({'message': f'Subscription check failed: {str(e)}'}), 500
    
    return decorated_function

def check_feature_access(feature_name):
    """Decorator to check if user has access to specific feature"""
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            try:
                subscription = get_user_subscription(current_user['uid'])
                
                if not subscription:
                    return jsonify({
                        'message': 'No active subscription.',
                        'requiresSubscription': True
                    }), 403
                
                features = subscription.get('features', {})
                if not features.get(feature_name, False):
                    return jsonify({
                        'message': f'This feature is not available in your plan. Please upgrade.',
                        'feature': feature_name,
                        'currentPlan': subscription.get('planId'),
                        'requiresUpgrade': True
                    }), 403
                
                request.subscription = subscription
                return f(current_user, *args, **kwargs)
                
            except Exception as e:
                return jsonify({'message': f'Feature check failed: {str(e)}'}), 500
        
        return decorated_function
    return decorator
