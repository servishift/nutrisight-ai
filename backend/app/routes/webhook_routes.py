from flask import Blueprint, request, jsonify
from app.services.webhook_service import webhook_service
from app.middleware.auth_middleware import require_auth

webhook_bp = Blueprint('webhooks', __name__, url_prefix='/api/webhooks')

@webhook_bp.route('', methods=['GET'])
@require_auth
def get_webhooks(current_user):
    """Get all webhooks for current user"""
    try:
        webhooks = webhook_service.get_user_webhooks(current_user['uid'])
        return jsonify({'webhooks': webhooks}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@webhook_bp.route('', methods=['POST'])
@require_auth
def create_webhook(current_user):
    """Create new webhook"""
    try:
        data = request.get_json()
        url = data.get('url')
        events = data.get('events', [])
        name = data.get('name')
        
        if not url or not events:
            return jsonify({'message': 'URL and events are required'}), 400
        
        webhook = webhook_service.create_webhook(
            user_id=current_user['uid'],
            url=url,
            events=events,
            name=name
        )
        
        return jsonify({
            'message': 'Webhook created successfully',
            'webhook': webhook
        }), 201
    
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@webhook_bp.route('/<webhook_id>', methods=['DELETE'])
@require_auth
def delete_webhook(current_user, webhook_id):
    """Delete webhook"""
    try:
        success = webhook_service.delete_webhook(webhook_id, current_user['uid'])
        
        if not success:
            return jsonify({'message': 'Webhook not found'}), 404
        
        return jsonify({'message': 'Webhook deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@webhook_bp.route('/<webhook_id>/logs', methods=['GET'])
@require_auth
def get_webhook_logs(current_user, webhook_id):
    """Get webhook delivery logs"""
    try:
        logs = webhook_service.get_webhook_logs(webhook_id)
        return jsonify({'logs': logs}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@webhook_bp.route('/test', methods=['POST'])
@require_auth
def test_webhook(current_user):
    """Test webhook endpoint"""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'message': 'URL is required'}), 400
        
        # Send test payload
        import requests
        test_payload = {
            'event': 'webhook.test',
            'timestamp': '2024-01-20T10:00:00Z',
            'data': {'message': 'This is a test webhook from NutriSight AI'}
        }
        
        response = requests.post(url, json=test_payload, timeout=10)
        
        return jsonify({
            'success': response.status_code == 200,
            'statusCode': response.status_code,
            'message': 'Test webhook sent'
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 200
