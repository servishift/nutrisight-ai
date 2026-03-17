"""
Nutrition Lookup Routes (Flask Blueprint)
"""
from flask import Blueprint, request, jsonify
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re

nutrition_bp = Blueprint('nutrition', __name__, url_prefix='/api/nutrition')

# Global model instances
vectorizer = None
food_vectors = None
nutrition_db = None

def load_models():
    """Load trained models"""
    global vectorizer, food_vectors, nutrition_db
    
    if vectorizer is not None:
        return  # Already loaded
    
    model_dir = "models"
    
    try:
        vectorizer = joblib.load(f"{model_dir}/ingredient_vectorizer.pkl")
        food_vectors = joblib.load(f"{model_dir}/food_vectors.pkl")
        nutrition_db = pd.read_csv(f"{model_dir}/nutrition_database.csv")
        print(f"[OK] Loaded nutrition lookup models ({len(nutrition_db):,} foods)")
    except Exception as e:
        print(f"[ERROR] Failed to load models: {e}")
        raise

def find_nutrition_matches(ingredient_text, top_n=5):
    """Find nutrition matches for ingredient"""
    load_models()
    
    # Clean ingredient text - remove common modifiers
    cleaned = ingredient_text.lower()
    remove_words = ['organic', 'fresh', 'raw', 'cooked', 'frozen', 'dried', 'natural']
    for word in remove_words:
        cleaned = cleaned.replace(word, '')
    cleaned = cleaned.strip()
    
    # Vectorize query
    query_vector = vectorizer.transform([cleaned])
    
    # Calculate similarity
    similarities = cosine_similarity(query_vector, food_vectors)[0]
    
    # Get top matches
    top_indices = np.argsort(similarities)[-top_n*3:][::-1]  # Get more candidates
    
    matches = []
    # Filter out processed/breaded versions for simple ingredients
    exclude_terms = ['breaded', 'battered', 'fried', 'nugget', 'tender', 'patty', 'processed']
    
    for idx in top_indices:
        if similarities[idx] > 0.05 and len(matches) < top_n:
            food = nutrition_db.iloc[idx]
            description = str(food['description']).lower()
            
            # Skip if it's a processed version and we're looking for simple ingredient
            if any(term in cleaned.split() for term in ['breast', 'rice', 'broccoli', 'salmon']):
                if any(term in description for term in exclude_terms):
                    continue
            
            # Handle NaN values
            category = food.get('category_name')
            brand = food.get('brand_owner')
            
            matches.append({
                'name': food['description'],
                'confidence': float(similarities[idx]),
                'nutrition': {
                    'energy_kcal': float(food.get('energy_kcal', 0)),
                    'protein_g': float(food.get('protein_g', 0)),
                    'total_fat_g': float(food.get('total_fat_g', 0)),
                    'carbohydrate_g': float(food.get('carbohydrate_g', 0)),
                    'fiber_g': float(food.get('fiber_g', 0)),
                    'sugars_g': float(food.get('sugars_g', 0)),
                    'sodium_mg': float(food.get('sodium_mg', 0)),
                    'calcium_mg': float(food.get('calcium_mg', 0)),
                    'iron_mg': float(food.get('iron_mg', 0)),
                    'saturated_fat_g': float(food.get('saturated_fat_g', 0)),
                    'cholesterol_mg': float(food.get('cholesterol_mg', 0)),
                    'vitamin_a_ug': float(food.get('vitamin_a_ug', 0)),
                    'vitamin_c_mg': float(food.get('vitamin_c_mg', 0))
                },
                'category': str(category) if pd.notna(category) else None,
                'brand': str(brand) if pd.notna(brand) else None
            })
    
    return matches

@nutrition_bp.route('/lookup', methods=['POST'])
def lookup_ingredient():
    """
    Lookup nutrition data for a single ingredient
    
    POST /api/nutrition/lookup
    Body: { "ingredient": "chicken breast" }
    """
    try:
        data = request.get_json()
        ingredient = data.get('ingredient', '').strip()
        
        if not ingredient:
            return jsonify({'message': 'Ingredient is required'}), 400
        
        matches = find_nutrition_matches(ingredient, top_n=5)
        
        if not matches:
            return jsonify({'message': f'No nutrition data found for "{ingredient}"'}), 404
        
        return jsonify({
            'ingredient': ingredient,
            'matches': matches,
            'best_match': matches[0] if matches else None
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@nutrition_bp.route('/analyze', methods=['POST'])
def analyze_ingredients():
    """
    Analyze a list of ingredients and return aggregated nutrition
    
    POST /api/nutrition/analyze
    Body: { "ingredients": "chicken breast, brown rice, broccoli" }
    """
    try:
        data = request.get_json()
        ingredients_text = data.get('ingredients', '').strip()
        
        if not ingredients_text:
            return jsonify({'message': 'Ingredients are required'}), 400
        
        # Split ingredients
        ingredients = [i.strip() for i in re.split(r'[,;\n]', ingredients_text) if i.strip()]
        
        if not ingredients:
            return jsonify({'message': 'No valid ingredients provided'}), 400
        
        matched_count = 0
        unmatched = []
        per_ingredient_results = []
        
        # Aggregate nutrition
        total_nutrition = {
            'energy_kcal': 0,
            'protein_g': 0,
            'total_fat_g': 0,
            'carbohydrate_g': 0,
            'fiber_g': 0,
            'sugars_g': 0,
            'sodium_mg': 0,
            'calcium_mg': 0,
            'iron_mg': 0,
            'saturated_fat_g': 0,
            'cholesterol_mg': 0,
            'vitamin_a_ug': 0,
            'vitamin_c_mg': 0
        }
        
        for ingredient in ingredients:
            matches = find_nutrition_matches(ingredient, top_n=3)
            
            result = {
                'ingredient': ingredient,
                'matches': matches,
                'best_match': matches[0] if matches else None
            }
            per_ingredient_results.append(result)
            
            if matches and matches[0]['confidence'] > 0.3:
                matched_count += 1
                # Add to total
                for key in total_nutrition:
                    total_nutrition[key] += matches[0]['nutrition'].get(key, 0)
            else:
                unmatched.append(ingredient)
        
        # Calculate averages
        if matched_count > 0:
            for key in total_nutrition:
                total_nutrition[key] = round(total_nutrition[key] / matched_count, 2)
        
        return jsonify({
            'total_ingredients': len(ingredients),
            'matched_ingredients': matched_count,
            'unmatched_ingredients': unmatched,
            'aggregated_nutrition': total_nutrition,
            'per_ingredient_results': per_ingredient_results
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@nutrition_bp.route('/health', methods=['GET'])
def health_check():
    """Check if nutrition lookup service is ready"""
    try:
        load_models()
        return jsonify({
            'status': 'healthy',
            'foods_indexed': len(nutrition_db),
            'model_loaded': vectorizer is not None
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
