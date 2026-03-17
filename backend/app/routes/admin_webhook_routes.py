from flask import Blueprint, request, jsonify
from app.services.webhook_service import webhook_service
from app.middleware.admin_middleware import require_admin

admin_webhook_bp = Blueprint('admin_webhooks', __name__, url_prefix='/api/admin')

@admin_webhook_bp.route('/webhooks', methods=['GET'])
@require_admin
def get_all_webhooks(current_admin):
    """Get all webhooks (admin only)"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        webhooks = db.collection('webhooks')\
            .where('status', '==', 'active')\
            .stream()
        
        webhook_list = []
        for w in webhooks:
            data = w.to_dict()
            data['id'] = w.id
            webhook_list.append(data)
        
        return jsonify({'webhooks': webhook_list}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_webhook_bp.route('/webhooks/<webhook_id>', methods=['DELETE'])
@require_admin
def admin_delete_webhook(current_admin, webhook_id):
    """Delete any webhook (admin only)"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        webhook_ref = db.collection('webhooks').document(webhook_id)
        webhook = webhook_ref.get()
        
        if not webhook.exists:
            return jsonify({'message': 'Webhook not found'}), 404
        
        webhook_ref.update({'status': 'deleted'})
        return jsonify({'message': 'Webhook deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_webhook_bp.route('/webhook-stats', methods=['GET'])
@require_admin
def get_webhook_stats(current_admin):
    """Get webhook statistics (admin only)"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        webhooks = list(db.collection('webhooks').stream())
        
        total = len(webhooks)
        active = len([w for w in webhooks if w.to_dict().get('status') == 'active'])
        
        total_success = sum(w.to_dict().get('successCount', 0) for w in webhooks)
        total_failed = sum(w.to_dict().get('failureCount', 0) for w in webhooks)
        
        success_rate = 0
        if total_success + total_failed > 0:
            success_rate = (total_success / (total_success + total_failed)) * 100
        
        return jsonify({
            'totalWebhooks': total,
            'activeWebhooks': active,
            'totalDeliveries': total_success + total_failed,
            'successfulDeliveries': total_success,
            'failedDeliveries': total_failed,
            'successRate': round(success_rate, 1)
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
