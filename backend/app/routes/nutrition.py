"""
Nutrition Lookup API Service
FastAPI integration for ingredient-to-nutrition lookup
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])

# Global model instances
vectorizer = None
food_vectors = None
nutrition_db = None

class IngredientRequest(BaseModel):
    ingredients: str  # Comma or newline separated
    
class IngredientListRequest(BaseModel):
    ingredients: List[str]

class NutritionData(BaseModel):
    energy_kcal: float
    protein_g: float
    total_fat_g: float
    carbohydrate_g: float
    fiber_g: float
    sugars_g: float
    sodium_mg: float
    calcium_mg: float
    iron_mg: float
    saturated_fat_g: float
    cholesterol_mg: float
    vitamin_a_ug: Optional[float] = 0
    vitamin_c_mg: Optional[float] = 0

class IngredientMatch(BaseModel):
    name: str
    confidence: float
    nutrition: NutritionData
    category: Optional[str] = None
    brand: Optional[str] = None

class NutritionLookupResponse(BaseModel):
    ingredient: str
    matches: List[IngredientMatch]
    best_match: Optional[IngredientMatch] = None

class AggregatedNutritionResponse(BaseModel):
    total_ingredients: int
    matched_ingredients: int
    unmatched_ingredients: List[str]
    aggregated_nutrition: NutritionData
    per_ingredient_results: List[NutritionLookupResponse]

def load_models():
    """Load trained models"""
    global vectorizer, food_vectors, nutrition_db
    
    if vectorizer is not None:
        return  # Already loaded
    
    model_dir = "ml/models"
    
    try:
        vectorizer = joblib.load(f"{model_dir}/ingredient_vectorizer.pkl")
        food_vectors = joblib.load(f"{model_dir}/food_vectors.pkl")
        nutrition_db = pd.read_csv(f"{model_dir}/nutrition_database.csv")
        print(f"✓ Loaded nutrition lookup models ({len(nutrition_db):,} foods)")
    except Exception as e:
        print(f"✗ Failed to load models: {e}")
        raise

def find_nutrition_matches(ingredient_text: str, top_n: int = 5) -> List[Dict]:
    """Find nutrition matches for ingredient"""
    load_models()
    
    # Vectorize query
    query_vector = vectorizer.transform([ingredient_text.lower()])
    
    # Calculate similarity
    similarities = cosine_similarity(query_vector, food_vectors)[0]
    
    # Get top matches
    top_indices = np.argsort(similarities)[-top_n:][::-1]
    
    matches = []
    for idx in top_indices:
        if similarities[idx] > 0.05:  # Minimum threshold
            food = nutrition_db.iloc[idx]
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
                'category': food.get('category_name'),
                'brand': food.get('brand_owner')
            })
    
    return matches

@router.post("/lookup", response_model=NutritionLookupResponse)
async def lookup_ingredient(ingredient: str):
    """
    Lookup nutrition data for a single ingredient
    
    Example: POST /api/nutrition/lookup?ingredient=chicken breast
    """
    try:
        matches = find_nutrition_matches(ingredient, top_n=5)
        
        if not matches:
            raise HTTPException(status_code=404, detail=f"No nutrition data found for '{ingredient}'")
        
        return {
            "ingredient": ingredient,
            "matches": matches,
            "best_match": matches[0] if matches else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=AggregatedNutritionResponse)
async def analyze_ingredients(request: IngredientRequest):
    """
    Analyze a list of ingredients and return aggregated nutrition
    
    Example:
    POST /api/nutrition/analyze
    {
        "ingredients": "chicken breast, brown rice, broccoli, olive oil"
    }
    """
    try:
        # Split ingredients
        import re
        ingredients = [i.strip() for i in re.split(r'[,;\n]', request.ingredients) if i.strip()]
        
        if not ingredients:
            raise HTTPException(status_code=400, detail="No ingredients provided")
        
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
                "ingredient": ingredient,
                "matches": matches,
                "best_match": matches[0] if matches else None
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
        
        return {
            "total_ingredients": len(ingredients),
            "matched_ingredients": matched_count,
            "unmatched_ingredients": unmatched,
            "aggregated_nutrition": total_nutrition,
            "per_ingredient_results": per_ingredient_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Check if nutrition lookup service is ready"""
    try:
        load_models()
        return {
            "status": "healthy",
            "foods_indexed": len(nutrition_db),
            "model_loaded": vectorizer is not None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
