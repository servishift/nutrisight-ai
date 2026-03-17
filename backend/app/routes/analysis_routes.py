from flask import Blueprint, request, jsonify, g
from datetime import datetime
from firebase_admin import firestore
from app.services.allergen_engine import detect_allergens
from app.services.additive_engine import detect_additives
from app.services.scoring_engine import (
    parse_ingredients,
    calculate_clean_label_score,
    calculate_health_risk_score,
    get_top_ingredients
)
from app.services.ml_service import ml_service
from app.services.webhook_service import webhook_service
from app.middleware.auth_middleware import require_auth
from app.middleware.request_tracker import track_request
from app.middleware.security import require_auth_or_anon, enforce_free_limit, rate_limit_by_user

analysis_bp = Blueprint('analysis', __name__, url_prefix='/api')

_db = None
def get_db():
    global _db
    if _db is None:
        _db = firestore.client()
    return _db

@analysis_bp.route('/analyze', methods=['POST'])
@require_auth_or_anon
@enforce_free_limit
@rate_limit_by_user(limit=200, window=3600, scope='analyze')
@track_request
def analyze():
    """Full ingredient analysis — free tier (admin-controlled limit) for anon, subscription-enforced for auth users"""
    try:
        data = request.get_json()
        ingredient_text = data.get('ingredientText', '')

        if not ingredient_text.strip():
            return jsonify({'message': 'Ingredient text is required'}), 400

        ingredients = parse_ingredients(ingredient_text)
        allergens = detect_allergens(ingredient_text)
        additives = detect_additives(ingredient_text)
        clean_label_score, clean_label_breakdown = calculate_clean_label_score(ingredients, additives)
        health_risk_score, health_risk_breakdown = calculate_health_risk_score(additives, allergens)
        top_ingredients = get_top_ingredients(ingredients)
        ml_prediction = ml_service.predict_category(ingredient_text)

        result = {
            'allergens': allergens,
            'additives': additives,
            'category': {
                'category': ml_prediction['predicted_category'],
                'confidence': ml_prediction['confidence']
            } if ml_prediction else None,
            'ingredientCount': len(ingredients),
            'ingredients': ingredients,
            'topIngredients': top_ingredients,
            'cleanLabelScore': clean_label_score,
            'cleanLabelBreakdown': clean_label_breakdown,
            'healthRisk': {
                'score': health_risk_score,
                'riskLevel': 'high' if health_risk_score > 60 else 'moderate' if health_risk_score > 30 else 'low',
                'additiveCount': len(additives),
                'factors': health_risk_breakdown,
                'description': get_risk_description(health_risk_score)
            },
            'analyzedAt': datetime.utcnow().isoformat() + 'Z'
        }

        # Persist analysis + increment usage counter
        user_id = g.user_id
        api_key_id = getattr(g, 'api_key_data', {}).get('id') if getattr(g, 'is_api_key', False) else None
        try:
            db = get_db()
            doc_ref = db.collection('analyses').add({
                'userId': user_id or 'anonymous',
                'apiKeyId': api_key_id,
                'ingredientText': ingredient_text[:500],
                'cleanLabelScore': clean_label_score,
                'healthRiskScore': health_risk_score,
                'allergenCount': len(allergens),
                'additiveCount': len(additives),
                'ingredientCount': len(ingredients),
                'category': ml_prediction['predicted_category'] if ml_prediction else None,
                'analyzedAt': firestore.SERVER_TIMESTAMP
            })
            # Increment subscription usage counter
            if user_id and not api_key_id:
                _increment_analysis_usage(user_id, db)
            # Trigger webhook
            if user_id:
                webhook_service.trigger_event('analysis.completed', {
                    'analysisId': doc_ref[1].id,
                    'cleanLabelScore': clean_label_score,
                    'healthRiskScore': health_risk_score,
                    'allergenCount': len(allergens),
                    'additiveCount': len(additives)
                }, user_id)
            if api_key_id:
                from app.services.phase4_service import phase4_service
                phase4_service.log_api_usage(api_key_id, '/api/analyze', 200, 50)
        except Exception as e:
            print(f'Failed to save analysis: {e}')

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': f'Analysis failed: {str(e)}'}), 500


def _increment_analysis_usage(user_id: str, db):
    """Atomically increment analysesUsed on the active subscription."""
    try:
        subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        for sub in subs:
            sub.reference.update({'analysesUsed': firestore.Increment(1)})
    except Exception as e:
        print(f'Failed to increment usage: {e}')

@analysis_bp.route('/detect-allergens', methods=['POST'])
@require_auth_or_anon
@rate_limit_by_user(limit=100, window=3600, scope='allergens')
@track_request
def detect_allergens_only():
    """Allergen detection only"""
    try:
        data = request.get_json()
        ingredient_text = data.get('ingredientText', '')

        if not ingredient_text.strip():
            return jsonify({'message': 'Ingredient text is required'}), 400

        allergens = detect_allergens(ingredient_text)

        return jsonify({'allergens': allergens}), 200
    except Exception as e:
        return jsonify({'message': f'Detection failed: {str(e)}'}), 500

@analysis_bp.route('/calculate-score', methods=['POST'])
@require_auth_or_anon
@rate_limit_by_user(limit=100, window=3600, scope='score')
@track_request
def calculate_score():
    """Calculate clean label and health scores"""
    try:
        data = request.get_json()
        ingredient_text = data.get('ingredientText', '')

        if not ingredient_text.strip():
            return jsonify({'message': 'Ingredient text is required'}), 400

        ingredients = parse_ingredients(ingredient_text)
        allergens = detect_allergens(ingredient_text)
        additives = detect_additives(ingredient_text)

        clean_label_score = calculate_clean_label_score(ingredients, additives)
        health_risk_score = calculate_health_risk_score(additives, allergens)

        return jsonify({
            'cleanLabelScore': clean_label_score,
            'healthRiskScore': health_risk_score
        }), 200
    except Exception as e:
        return jsonify({'message': f'Calculation failed: {str(e)}'}), 500

def get_risk_description(score):
    """Get human-readable risk description"""
    if score > 60:
        return 'High risk: Contains multiple high-risk additives or allergens'
    elif score > 30:
        return 'Medium risk: Contains some additives or allergens to be aware of'
    else:
        return 'Low risk: Minimal additives and allergens detected'
