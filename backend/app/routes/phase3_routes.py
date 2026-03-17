"""
Phase 3 API Routes: Similarity Search & Brand Prediction
"""

from flask import Blueprint, request, jsonify
from app.services.phase3_service import phase3_service
from app.middleware.auth_middleware import require_auth
from app.middleware.rate_limiter import rate_limit
from app.middleware.request_tracker import track_request

phase3_bp = Blueprint('phase3', __name__, url_prefix='/api/phase3')

@phase3_bp.route('/similarity', methods=['POST'])
@require_auth
@rate_limit(limit=100, window=60)
@track_request
def similarity_search(current_user):
    """
    POST /api/phase3/similarity
    Body: { "ingredients": "wheat flour, sugar, salt", "topK": 10 }
    """
    try:
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        top_k = data.get('topK', 10)
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        results = phase3_service.similarity_search(ingredients, top_k)
        
        return jsonify({
            'query': ingredients,
            'results': results,
            'count': len(results),
            'metadata': {
                'dataSource': 'USDA FoodData Central',
                'totalProducts': 10000,
                'model': 'TF-IDF Cosine Similarity',
                'lastUpdated': '2025-01-18',
                'accuracy': 'High - Based on official USDA database'
            }
        }), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'Similarity search failed: {str(e)}'}), 500


@phase3_bp.route('/brand-prediction', methods=['POST'])
@require_auth
@track_request
def brand_prediction(current_user):
    """
    POST /api/phase3/brand-prediction
    Body: { "ingredients": "wheat flour, sugar, salt", "topK": 5 }
    """
    try:
        data = request.get_json()
        ingredients = data.get('ingredients', '')
        top_k = data.get('topK', 5)
        
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        predictions = phase3_service.predict_brand(ingredients, top_k)
        
        return jsonify({
            'ingredients': ingredients,
            'predictions': predictions
        }), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'Brand prediction failed: {str(e)}'}), 500


@phase3_bp.route('/reformulation', methods=['POST'])
@require_auth
@track_request
def detect_reformulation(current_user):
    """
    POST /api/phase3/reformulation
    Body: { "originalIngredients": "...", "updatedIngredients": "..." }
    """
    try:
        data = request.get_json()
        original = data.get('originalIngredients', '')
        updated = data.get('updatedIngredients', '')
        
        if not original or not updated:
            return jsonify({'error': 'Both original and updated ingredients required'}), 400
        
        result = phase3_service.detect_reformulation(original, updated)
        
        return jsonify(result), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'Reformulation detection failed: {str(e)}'}), 500


@phase3_bp.route('/embeddings', methods=['POST'])
@require_auth
@track_request
def get_embeddings(current_user):
    """
    POST /api/phase3/embeddings
    Body: { "category": "Snacks" } (optional)
    """
    try:
        data = request.get_json() or {}
        category = data.get('category', None)
        
        results = phase3_service.get_embeddings_visualization(category)
        
        return jsonify({
            'embeddings': results,
            'count': len(results)
        }), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'Embeddings visualization failed: {str(e)}'}), 500


@phase3_bp.route('/health', methods=['GET'])
def health_check():
    """Check if Phase 3 models are loaded"""
    try:
        status = {
            'similarity_model': phase3_service.similarity_data is not None,
            'brand_model': phase3_service.brand_data is not None
        }
        
        all_loaded = all(status.values())
        
        return jsonify({
            'status': 'ready' if all_loaded else 'not_ready',
            'models': status
        }), 200 if all_loaded else 503
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
