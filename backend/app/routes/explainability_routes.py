from flask import Blueprint, jsonify, request
from app.services.explainability_service import explainability_service
from app.middleware.request_tracker import track_request

explainability_bp = Blueprint('explainability', __name__, url_prefix='/api/explain')

@explainability_bp.route('/prediction', methods=['POST'])
@track_request
def explain_prediction():
    """Explain a single prediction using SHAP"""
    try:
        data = request.get_json()
        ingredient_text = data.get('ingredientText', '')
        top_n = data.get('topN', 10)
        
        if not ingredient_text.strip():
            return jsonify({'message': 'Ingredient text is required'}), 400
        
        result = explainability_service.explain_prediction(ingredient_text, top_n)
        
        if not result:
            return jsonify({'message': 'Failed to explain prediction'}), 500
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': f'Explanation failed: {str(e)}'}), 500
