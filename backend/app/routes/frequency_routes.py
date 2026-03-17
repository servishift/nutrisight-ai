from flask import Blueprint, jsonify, request
from app.services.frequency_analyzer import frequency_analyzer

frequency_bp = Blueprint('frequency', __name__, url_prefix='/api/frequency')

@frequency_bp.route('/top-ingredients', methods=['GET'])
def get_top_ingredients():
    """Get top N most frequent ingredients"""
    try:
        top_n = request.args.get('limit', default=50, type=int)
        top_n = min(top_n, 100)  # Max 100
        
        result = frequency_analyzer.get_top_ingredients(top_n)
        
        return jsonify({
            'ingredients': result,
            'total': len(result)
        }), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get top ingredients: {str(e)}'}), 500

@frequency_bp.route('/category-analysis', methods=['GET'])
def get_category_analysis():
    """Get ingredient frequency by category"""
    try:
        result = frequency_analyzer.get_category_frequency()
        
        return jsonify({
            'categories': result,
            'total': len(result)
        }), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get category analysis: {str(e)}'}), 500

@frequency_bp.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear frequency analysis cache"""
    try:
        frequency_analyzer.clear_cache()
        return jsonify({'message': 'Cache cleared successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to clear cache: {str(e)}'}), 500
