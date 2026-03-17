from flask import Blueprint, request, jsonify
from app.services.indian_food_service import get_analyzer
from app.middleware.security import require_auth_or_anon
from app.middleware.auth_middleware import require_auth

indian_bp = Blueprint('indian', __name__, url_prefix='/api')

@indian_bp.route('/analyze/indian', methods=['POST'])
@require_auth
def analyze_indian_food(*args, **kwargs):
    """Analyze Indian food with ML models"""
    try:
        data = request.json
        food_name = data.get('food_name', 'Unknown')
        nutrients = data.get('nutrients', {})
        
        analyzer = get_analyzer()
        result = analyzer.analyze_complete(food_name, nutrients)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@indian_bp.route('/indian/search', methods=['GET'])
@require_auth_or_anon
def search_indian_foods(*args, **kwargs):
    """Search Indian foods by name"""
    try:
        query = request.args.get('q', '')
        limit = int(request.args.get('limit', 20))
        
        analyzer = get_analyzer()
        results = analyzer.search_foods(query, limit)
        
        return jsonify({
            'query': query,
            'count': len(results),
            'results': results
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@indian_bp.route('/indian/food/<food_name>', methods=['GET'])
@require_auth_or_anon
def get_indian_food(*args, **kwargs):
    """Get complete nutrition info for a specific food"""
    try:
        food_name = kwargs.get('food_name', '')
        analyzer = get_analyzer()
        result = analyzer.get_food_by_name(food_name)
        
        if result:
            return jsonify(result), 200
        else:
            return jsonify({'error': 'Food not found'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@indian_bp.route('/indian/category/<category>', methods=['GET'])
@require_auth_or_anon
def get_category_foods(*args, **kwargs):
    """Get all foods in a category"""
    try:
        category = kwargs.get('category', '')
        limit = int(request.args.get('limit', 50))
        
        analyzer = get_analyzer()
        results = analyzer.get_category_foods(category, limit)
        
        return jsonify({
            'category': category,
            'count': len(results),
            'results': results
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@indian_bp.route('/indian/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    categories = [
        'Beverages',
        'Dairy Products',
        'Fruits',
        'Grains & Cereals',
        'Meat & Seafood',
        'Other',
        'Pulses & Legumes',
        'Snacks & Sweets',
        'Spices & Condiments',
        'Vegetables'
    ]
    
    return jsonify({'categories': categories}), 200

@indian_bp.route('/indian/predict/calories', methods=['POST'])
@require_auth
def predict_calories(*args, **kwargs):
    """Predict calories from macronutrients"""
    try:
        nutrients = request.json
        
        analyzer = get_analyzer()
        calories = analyzer.predict_calories(nutrients)
        
        return jsonify({
            'predicted_calories': round(calories, 2),
            'input': nutrients
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@indian_bp.route('/indian/predict/health', methods=['POST'])
@require_auth
def predict_health_labels(*args, **kwargs):
    """Predict health labels from nutrients"""
    try:
        nutrients = request.json
        
        analyzer = get_analyzer()
        labels = analyzer.predict_health_labels(nutrients)
        
        return jsonify({
            'health_labels': labels,
            'input': nutrients
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@indian_bp.route('/indian/similar', methods=['POST'])
@require_auth
def find_similar_foods(*args, **kwargs):
    """Find similar foods based on nutritional profile"""
    try:
        nutrients = request.json
        top_n = int(request.args.get('top_n', 5))
        
        analyzer = get_analyzer()
        similar = analyzer.find_similar_foods(nutrients, top_n)
        
        return jsonify({
            'similar_foods': similar,
            'count': len(similar)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@indian_bp.route('/indian/stats', methods=['GET'])
@require_auth_or_anon
def get_stats(*args, **kwargs):
    """Get database statistics"""
    try:
        analyzer = get_analyzer()
        
        stats = {
            'total_foods': len(analyzer.foods_db),
            'categories': analyzer.foods_db['category'].value_counts().to_dict(),
            'avg_calories': round(analyzer.foods_db['energy_kcal'].mean(), 2),
            'avg_protein': round(analyzer.foods_db['protein_g'].mean(), 2),
            'avg_fat': round(analyzer.foods_db['fat_g'].mean(), 2),
            'avg_carbs': round(analyzer.foods_db['carb_g'].mean(), 2),
            'source': 'Anuvaad_INDB_2024.11',
            'model_version': '1.0'
        }
        
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
