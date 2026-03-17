"""
Admin Pricing Management Routes
Allows admin to update platform and API plan prices dynamically via Firestore.
"""
from flask import Blueprint, request, jsonify
from app.middleware.admin_middleware import require_admin
from firebase_admin import firestore
from datetime import datetime, timezone

admin_pricing_bp = Blueprint('admin_pricing', __name__, url_prefix='/api/admin/pricing')


@admin_pricing_bp.route('/platform', methods=['GET'])
@require_admin
def get_platform_plans(current_user):
    """Get platform plans with any Firestore overrides merged in."""
    from app.services.payment_service import get_plans
    return jsonify({'plans': get_plans()}), 200


@admin_pricing_bp.route('/platform/<plan_id>', methods=['PUT'])
@require_admin
def update_platform_plan(current_user, plan_id):
    """Update a platform plan price/limits in Firestore."""
    try:
        from app.services.payment_service import DEFAULT_PLANS
        if plan_id not in DEFAULT_PLANS:
            return jsonify({'message': 'Invalid plan ID'}), 400

        data = request.get_json()
        update = {'updatedBy': current_user['email'], 'updatedAt': datetime.now(timezone.utc)}

        if 'price' in data:
            update['price'] = int(data['price'])
        if 'limits' in data:
            update['limits'] = data['limits']

        db = firestore.client()
        db.collection('platform_plan_configs').document(plan_id).set(update, merge=True)

        return jsonify({'message': f'Platform plan {plan_id} updated', 'update': update}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400


@admin_pricing_bp.route('/api', methods=['GET'])
@require_admin
def get_api_plans_admin(current_user):
    """Get API plans with any Firestore overrides merged in."""
    from app.routes.api_pricing_routes import get_api_plans
    return jsonify({'plans': get_api_plans()}), 200


@admin_pricing_bp.route('/api/<plan_id>', methods=['PUT'])
@require_admin
def update_api_plan(current_user, plan_id):
    """Update an API plan price/limits in Firestore."""
    try:
        from app.routes.api_pricing_routes import DEFAULT_API_PLANS
        if plan_id not in DEFAULT_API_PLANS:
            return jsonify({'message': 'Invalid API plan ID'}), 400

        data = request.get_json()
        update = {'updatedBy': current_user['email'], 'updatedAt': datetime.now(timezone.utc)}

        if 'price' in data:
            update['price'] = int(data['price'])
        if 'requests' in data:
            update['requests'] = int(data['requests'])
        if 'rate_limit' in data:
            update['rate_limit'] = int(data['rate_limit'])

        db = firestore.client()
        db.collection('api_plan_configs').document(plan_id).set(update, merge=True)

        return jsonify({'message': f'API plan {plan_id} updated', 'update': update}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400
