"""
Public API Routes (API Key Authentication)
"""
from flask import Blueprint, request, jsonify
from functools import wraps
from firebase_admin import firestore
from datetime import datetime, timezone

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

def require_api_key(f):
    """Decorator to require API key authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        import hashlib
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'API key required'}), 401
        
        # Hash the API key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Validate API key
        db = firestore.client()
        keys = db.collection('api_keys').where('key_hash', '==', key_hash).where('is_active', '==', True).limit(1).stream()
        
        key_doc = next(keys, None)
        if not key_doc:
            return jsonify({'error': 'Invalid API key'}), 401
        
        key_data = key_doc.to_dict()
        user_id = key_data['user_id']
        
        # Check API subscription limits
        subs = db.collection('api_subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        sub = next(subs, None)
        if not sub:
            return jsonify({'error': 'No active API subscription. Please subscribe at /api-pricing'}), 402
        
        sub_data = sub.to_dict()
        requests_limit = sub_data.get('requestsLimit', 0)
        requests_used = sub_data.get('requestsUsed', 0)
        
        # Check if limit exceeded (unless unlimited)
        if requests_limit != -1 and requests_used >= requests_limit:
            return jsonify({'error': 'API request limit exceeded. Please upgrade your plan at /api-pricing'}), 429
        
        # Update usage counters (shared pool across all keys)
        db.collection('api_keys').document(key_doc.id).update({
            'usage_count': firestore.Increment(1),
            'last_used': datetime.now(timezone.utc)
        })
        
        new_usage = requests_used + 1
        db.collection('api_subscriptions').document(sub.id).update({
            'requestsUsed': firestore.Increment(1)
        })
        
        # Send usage notifications at thresholds
        if requests_limit != -1:
            usage_percent = (new_usage / requests_limit) * 100
            last_notified = sub_data.get('lastNotifiedAt', 0)
            
            # Notify at 80%, 90%, 100%
            if usage_percent >= 80 and last_notified < 80:
                _send_usage_notification(user_id, sub_data, 80, new_usage, requests_limit)
                db.collection('api_subscriptions').document(sub.id).update({'lastNotifiedAt': 80})
            elif usage_percent >= 90 and last_notified < 90:
                _send_usage_notification(user_id, sub_data, 90, new_usage, requests_limit)
                db.collection('api_subscriptions').document(sub.id).update({'lastNotifiedAt': 90})
            elif usage_percent >= 100 and last_notified < 100:
                _send_usage_notification(user_id, sub_data, 100, new_usage, requests_limit)
                db.collection('api_subscriptions').document(sub.id).update({'lastNotifiedAt': 100})
        
        # Add user_id to request
        request.api_user_id = user_id
        request.api_key_tier = sub_data.get('planId', 'free')
        
        return f(*args, **kwargs)
    
    return decorated_function

@api_bp.route('/analyze', methods=['POST'])
@require_api_key
def api_analyze():
    """Analyze ingredients via API"""
    try:
        from app.services.ml_service import ml_service
        
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        # Use predict_category which is the main analysis method
        result = ml_service.predict_category(ingredients)
        
        return jsonify({
            'success': True,
            'category': result['predicted_category'],
            'confidence': result['confidence'],
            'all_predictions': result.get('top_predictions', [])
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/predict-category', methods=['POST'])
@require_api_key
def api_predict_category():
    """Predict product category via API"""
    try:
        from app.services.ml_service import ml_service
        
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        result = ml_service.predict_category(ingredients)
        
        return jsonify({
            'success': True,
            'predictions': result.get('top_predictions', [])
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/predict-brand', methods=['POST'])
@require_api_key
def api_predict_brand():
    """Predict brand via API"""
    try:
        from app.services.phase3_service import phase3_service
        
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        top_k = data.get('top_k', 5)
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        predictions = phase3_service.predict_brand(ingredients, top_k)
        
        return jsonify({
            'success': True,
            'predictions': predictions
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/similarity-search', methods=['POST'])
@require_api_key
def api_similarity_search():
    """Find similar products via API"""
    try:
        from app.services.phase3_service import phase3_service
        
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        top_k = data.get('top_k', 5)
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        results = phase3_service.similarity_search(ingredients, top_k)
        
        return jsonify({
            'success': True,
            'results': results
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/indian/search', methods=['GET'])
@require_api_key
def api_indian_search():
    """Search Indian foods via API"""
    try:
        from app.services.indian_food_service import get_analyzer
        indian_service = get_analyzer()
        
        query = request.args.get('query', '')
        limit = int(request.args.get('limit', 10))
        
        if not query:
            return jsonify({'error': 'Query required'}), 400
        
        results = indian_service.search_foods(query, limit)
        
        return jsonify({
            'success': True,
            'results': results
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/indian/category/<category>', methods=['GET'])
@require_api_key
def api_indian_category(category):
    """Get Indian foods by category via API"""
    try:
        from app.services.indian_food_service import get_analyzer
        indian_service = get_analyzer()
        
        limit = int(request.args.get('limit', 10))
        foods = indian_service.get_category_foods(category, limit)
        
        return jsonify({
            'success': True,
            'foods': foods
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/indian/nutrition', methods=['POST'])
@require_api_key
def api_indian_nutrition():
    """Get nutrition for Indian food via API"""
    try:
        from app.services.indian_food_service import get_analyzer
        indian_service = get_analyzer()
        
        data = request.get_json()
        food_name = data.get('food_name', '')
        
        if not food_name:
            return jsonify({'error': 'Food name required'}), 400
        
        nutrition = indian_service.get_food_by_name(food_name)
        
        return jsonify({
            'success': True,
            'nutrition': nutrition
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _send_usage_notification(user_id, sub_data, threshold, used, limit):
    """Send usage threshold notification"""
    try:
        from firebase_admin import auth
        from app.services.email_service import send_api_usage_alert
        user = auth.get_user(user_id)
        send_api_usage_alert(
            user.email,
            user.display_name or 'User',
            sub_data.get('planName', 'API Plan'),
            threshold,
            used,
            limit
        )
    except Exception as e:
        print(f'Failed to send usage notification: {str(e)}')

@api_bp.route('/health', methods=['GET'])
def api_health():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0',
        'endpoints': [
            '/api/v1/analyze',
            '/api/v1/predict-category',
            '/api/v1/predict-brand',
            '/api/v1/similarity-search'
        ]
    }), 200
