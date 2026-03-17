"""
Ingredient Search & Browse Routes
"""
from flask import Blueprint, request, jsonify
import pandas as pd

ingredient_search_bp = Blueprint('ingredient_search', __name__, url_prefix='/api/ingredients')

# Global cache
ingredient_list = None

def load_ingredient_list():
    """Load ingredient list from nutrition database"""
    global ingredient_list
    
    if ingredient_list is not None:
        return
    
    try:
        nutrition_db = pd.read_csv("models/nutrition_database.csv")
        
        # Create searchable ingredient list
        ingredient_list = []
        for idx, row in nutrition_db.iterrows():
            name = row.get('description')
            if pd.isna(name) or not isinstance(name, str):
                continue
            
            category = row.get('category_name')
            brand = row.get('brand_owner')
            
            ingredient_list.append({
                'id': idx,
                'name': name,
                'category': str(category) if pd.notna(category) else None,
                'brand': str(brand) if pd.notna(brand) else None,
                'nutrition': {
                    'energy_kcal': float(row.get('energy_kcal', 0)),
                    'protein_g': float(row.get('protein_g', 0)),
                    'total_fat_g': float(row.get('total_fat_g', 0)),
                    'carbohydrate_g': float(row.get('carbohydrate_g', 0)),
                    'fiber_g': float(row.get('fiber_g', 0)),
                    'sugars_g': float(row.get('sugars_g', 0)),
                    'sodium_mg': float(row.get('sodium_mg', 0)),
                    'calcium_mg': float(row.get('calcium_mg', 0)),
                    'iron_mg': float(row.get('iron_mg', 0)),
                    'saturated_fat_g': float(row.get('saturated_fat_g', 0)),
                    'cholesterol_mg': float(row.get('cholesterol_mg', 0))
                }
            })
        
        print(f"✓ Loaded {len(ingredient_list):,} ingredients for search")
    except Exception as e:
        print(f"✗ Failed to load ingredient list: {e}")
        ingredient_list = []

@ingredient_search_bp.route('/search', methods=['GET'])
def search_ingredients():
    """
    Search ingredients by name
    GET /api/ingredients/search?q=chicken&limit=20&offset=0
    """
    load_ingredient_list()
    
    query = request.args.get('q', '').lower().strip()
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    # Filter ingredients
    if query:
        filtered = [ing for ing in ingredient_list if query in ing['name'].lower()]
    else:
        filtered = ingredient_list
    
    total = len(filtered)
    results = filtered[offset:offset + limit]
    
    return jsonify({
        'query': query,
        'total': total,
        'results': [{'name': r['name'], 'category': r['category']} for r in results]
    }), 200

@ingredient_search_bp.route('/autocomplete', methods=['GET'])
def autocomplete():
    """
    Autocomplete ingredient names
    GET /api/ingredients/autocomplete?q=chick&limit=10
    """
    load_ingredient_list()
    
    query = request.args.get('q', '').lower().strip()
    limit = int(request.args.get('limit', 10))
    
    if not query or len(query) < 2:
        return jsonify({'suggestions': []}), 200
    
    # Get matching names
    suggestions = []
    seen = set()
    
    for ing in ingredient_list:
        name = ing['name']
        if query in name.lower() and name not in seen:
            suggestions.append({
                'name': name,
                'category': ing['category']
            })
            seen.add(name)
            
            if len(suggestions) >= limit:
                break
    
    return jsonify({'suggestions': suggestions}), 200

@ingredient_search_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    Get all food categories
    GET /api/ingredients/categories
    """
    load_ingredient_list()
    
    categories = {}
    for ing in ingredient_list:
        cat = ing['category']
        if cat:
            categories[cat] = categories.get(cat, 0) + 1
    
    # Sort by count
    sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)
    
    return jsonify({
        'total': len(sorted_cats),
        'categories': [{'name': cat, 'count': count} for cat, count in sorted_cats]
    }), 200

@ingredient_search_bp.route('/by-category/<category>', methods=['GET'])
def get_by_category(category):
    """
    Get ingredients by category
    GET /api/ingredients/by-category/Poultry Products?limit=50
    """
    load_ingredient_list()
    
    limit = int(request.args.get('limit', 50))
    
    results = [
        ing for ing in ingredient_list
        if ing['category'] and ing['category'].lower() == category.lower()
    ][:limit]
    
    return jsonify({
        'category': category,
        'total': len(results),
        'results': results
    }), 200

@ingredient_search_bp.route('/<int:ingredient_id>', methods=['GET'])
def get_ingredient(ingredient_id):
    """
    Get specific ingredient by ID
    GET /api/ingredients/123
    """
    load_ingredient_list()
    
    if ingredient_id < 0 or ingredient_id >= len(ingredient_list):
        return jsonify({'message': 'Ingredient not found'}), 404
    
    return jsonify(ingredient_list[ingredient_id]), 200

@ingredient_search_bp.route('/popular', methods=['GET'])
def get_popular():
    """
    Get popular/common ingredients
    GET /api/ingredients/popular?limit=50
    """
    load_ingredient_list()
    
    limit = int(request.args.get('limit', 50))
    
    # Common ingredient keywords
    common = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'rice', 'bread', 
              'milk', 'egg', 'cheese', 'potato', 'tomato', 'onion', 'garlic',
              'broccoli', 'carrot', 'apple', 'banana', 'orange', 'yogurt']
    
    results = []
    for keyword in common:
        matches = [ing for ing in ingredient_list if keyword in ing['name'].lower()]
        if matches:
            results.append(matches[0])  # Take first match
        
        if len(results) >= limit:
            break
    
    return jsonify({
        'total': len(results),
        'results': results
    }), 200
