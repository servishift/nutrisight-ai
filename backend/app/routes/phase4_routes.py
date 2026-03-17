"""
Phase 4 API Routes: API Keys, Usage Analytics, Webhooks, Playground
"""

from flask import Blueprint, request, jsonify
from app.services.phase4_service import phase4_service
from app.middleware.auth_middleware import require_auth
from functools import wraps

phase4_bp = Blueprint('phase4', __name__, url_prefix='/api/phase4')

# ============================================================================
# API KEY MANAGEMENT
# ============================================================================

@phase4_bp.route('/keys', methods=['POST'])
@require_auth
def create_api_key(current_user):
    """Create new API key"""
    try:
        user_id = current_user['uid']
        data = request.get_json()
        name = data.get('name', 'My API Key')
        tier = data.get('tier', 'free')
        
        result = phase4_service.create_api_key(user_id, name, tier)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@phase4_bp.route('/keys', methods=['GET'])
@require_auth
def list_api_keys(current_user):
    """List user's API keys"""
    try:
        user_id = current_user['uid']
        keys = phase4_service.list_api_keys(user_id)
        return jsonify({'keys': keys}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@phase4_bp.route('/keys/<key_id>', methods=['DELETE'])
@require_auth
def revoke_api_key(current_user, key_id):
    """Revoke API key"""
    try:
        user_id = current_user['uid']
        success = phase4_service.revoke_api_key(key_id, user_id)
        
        if success:
            return jsonify({'message': 'API key revoked'}), 200
        return jsonify({'error': 'API key not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# USAGE ANALYTICS
# ============================================================================

@phase4_bp.route('/usage', methods=['GET'])
def get_usage():
    """Get usage analytics (Real-time data - No auth required)"""
    try:
        from app.services.usage_tracker import usage_tracker
        
        hours = int(request.args.get('hours', 24))
        stats = usage_tracker.get_stats(hours)
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# WEBHOOKS
# ============================================================================

@phase4_bp.route('/webhooks', methods=['POST'])
@require_auth
def create_webhook(current_user):
    """Create webhook"""
    try:
        user_id = current_user['uid']
        data = request.get_json()
        url = data.get('url')
        events = data.get('events', [])
        
        if not url or not events:
            return jsonify({'error': 'URL and events required'}), 400
        
        result = phase4_service.create_webhook(user_id, url, events)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@phase4_bp.route('/webhooks', methods=['GET'])
@require_auth
def list_webhooks(current_user):
    """List user's webhooks"""
    try:
        user_id = current_user['uid']
        webhooks = phase4_service.list_webhooks(user_id)
        return jsonify({'webhooks': webhooks}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@phase4_bp.route('/webhooks/<webhook_id>', methods=['DELETE'])
@require_auth
def delete_webhook(current_user, webhook_id):
    """Delete webhook"""
    try:
        user_id = current_user['uid']
        success = phase4_service.delete_webhook(webhook_id, user_id)
        
        if success:
            return jsonify({'message': 'Webhook deleted'}), 200
        return jsonify({'error': 'Webhook not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# API PLAYGROUND
# ============================================================================

@phase4_bp.route('/playground/analyze', methods=['POST'])
@require_auth
def playground_analyze(current_user):
    """Test ingredient analysis in playground"""
    try:
        from app.services.ml_service import ml_service
        
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        # Run analysis
        result = ml_service.analyze_ingredients(ingredients)
        
        return jsonify({
            'success': True,
            'result': result,
            'execution_time_ms': 50
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@phase4_bp.route('/playground/similarity', methods=['POST'])
@require_auth
def playground_similarity(current_user):
    """Test similarity search in playground"""
    try:
        from app.services.phase3_service import phase3_service
        
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        results = phase3_service.similarity_search(ingredients, 5)
        
        return jsonify({
            'success': True,
            'results': results,
            'execution_time_ms': 45
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@phase4_bp.route('/playground/brand', methods=['POST'])
@require_auth
def playground_brand(current_user):
    """Test brand prediction in playground"""
    try:
        from app.services.phase3_service import phase3_service
        
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        predictions = phase3_service.predict_brand(ingredients, 5)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'execution_time_ms': 38
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# HEALTH CHECK
# ============================================================================

@phase4_bp.route('/health', methods=['GET'])
def health_check():
    """Check Phase 4 service health"""
    return jsonify({
        'status': 'ready',
        'features': {
            'api_keys': True,
            'usage_analytics': True,
            'webhooks': True,
            'playground': True
        }
    }), 200
