from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth
from app.services import payment_service

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payment')

@payment_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get all subscription plans (dynamic from Firestore)"""
    from app.services.payment_service import get_plans as fetch_plans
    return jsonify({'plans': fetch_plans()}), 200

@payment_bp.route('/credit-packages', methods=['GET'])
def get_credit_packages():
    """Get credit packages"""
    return jsonify({'packages': payment_service.CREDIT_PACKAGES}), 200

@payment_bp.route('/subscribe', methods=['POST'])
@require_auth
def create_subscription(current_user):
    """Create subscription order"""
    try:
        data = request.get_json()
        plan_id = data.get('planId')
        
        if not plan_id:
            return jsonify({'message': 'Plan ID required'}), 400
        
        order = payment_service.create_subscription_order(current_user['uid'], plan_id)
        return jsonify(order), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@payment_bp.route('/credits/create', methods=['POST'])
@require_auth
def create_credit_order(current_user):
    """Create credit purchase order"""
    try:
        data = request.get_json()
        package_id = data.get('packageId')
        
        if not package_id:
            return jsonify({'message': 'Package ID required'}), 400
        
        order = payment_service.create_credit_order(current_user['uid'], package_id)
        return jsonify(order), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@payment_bp.route('/verify', methods=['POST'])
@require_auth
def verify_payment(current_user):
    """Verify payment and activate subscription/credits"""
    try:
        data = request.get_json()
        order_id = data.get('orderId')
        payment_id = data.get('paymentId')
        signature = data.get('signature')
        
        if not all([order_id, payment_id, signature]):
            return jsonify({'message': 'Missing payment details'}), 400
        
        result = payment_service.verify_payment(order_id, payment_id, signature)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@payment_bp.route('/subscription', methods=['GET'])
@require_auth
def get_subscription(current_user):
    """Get user's current subscription"""
    try:
        subscription = payment_service.get_user_subscription(current_user['uid'])
        if not subscription:
            return jsonify({'subscription': None, 'message': 'No active subscription'}), 200
        return jsonify({'subscription': subscription}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@payment_bp.route('/usage', methods=['GET'])
@require_auth
def get_usage(current_user):
    """Get user's usage statistics"""
    try:
        subscription = payment_service.get_user_subscription(current_user['uid'])
        if not subscription:
            return jsonify({
                'used': {'analyses': 0, 'batchRows': 0, 'apiRequests': 0},
                'limits': {'analyses_per_month': 0, 'batch_rows_per_month': 0, 'api_requests_per_month': 0}
            }), 200
        
        limits = subscription.get('limits', {})
        return jsonify({
            'used': {
                'analyses': subscription.get('usedAnalyses', 0),
                'batchRows': subscription.get('usedBatchRows', 0),
                'apiRequests': subscription.get('usedApiRequests', 0)
            },
            'limits': limits
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@payment_bp.route('/razorpay-key', methods=['GET'])
def get_razorpay_key():
    """Get Razorpay public key"""
    from app.config import Config
    return jsonify({'keyId': Config.RAZORPAY_KEY_ID}), 200
