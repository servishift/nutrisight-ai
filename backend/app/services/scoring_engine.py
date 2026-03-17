"""
Scoring Engine
Calculates clean label score and health risk score
"""
import re

# Configurable scoring weights
SCORING_WEIGHTS = {
    'preservative': 5,
    'artificial_flavor': 3,
    'artificial_color': 4,
    'sweetener': 3,
    'emulsifier': 2,
    'stabilizer': 2,
    'antioxidant': 2,
    'whole_ingredient': -2,  # Bonus
    'vitamin_mineral': -1,   # Bonus
    'high_risk_multiplier': 3,
    'medium_risk_multiplier': 2,
    'low_risk_multiplier': 1,
    'allergen_penalty': 5,
    'high_ingredient_count': 10,
    'medium_ingredient_count': 5
}

def parse_ingredients(ingredient_text):
    """
    Parse ingredient text into list of individual ingredients
    """
    # Split by comma, semicolon, or newline
    ingredients = re.split(r'[,;\n]+', ingredient_text)
    # Clean and filter
    ingredients = [i.strip() for i in ingredients if i.strip()]
    return ingredients

def calculate_clean_label_score(ingredients, additives):
    """
    Calculate clean label score (0-100) with detailed breakdown
    """
    score = 100
    breakdown = []
    ingredient_count = len(ingredients)
    
    # Penalize for additives
    for additive in additives:
        additive_type = additive.get("type", "unknown")
        risk_level = additive["riskLevel"]
        base_penalty = SCORING_WEIGHTS.get(additive_type, 3)
        
        if risk_level == "high":
            penalty = base_penalty * SCORING_WEIGHTS['high_risk_multiplier']
        elif risk_level == "medium":
            penalty = base_penalty * SCORING_WEIGHTS['medium_risk_multiplier']
        else:
            penalty = base_penalty * SCORING_WEIGHTS['low_risk_multiplier']
        
        score -= penalty
        breakdown.append({
            'ingredient': additive['name'],
            'impact': 'negative',
            'points': -penalty,
            'reason': f"{risk_level.capitalize()} risk {additive_type}"
        })
    
    # Bonus for whole ingredients
    whole_keywords = ['whole grain', 'whole wheat', 'organic', 'natural']
    for ing in ingredients:
        ing_lower = ing.lower()
        for keyword in whole_keywords:
            if keyword in ing_lower:
                bonus = SCORING_WEIGHTS['whole_ingredient']
                score -= bonus  # Negative penalty = bonus
                breakdown.append({
                    'ingredient': ing,
                    'impact': 'positive',
                    'points': abs(bonus),
                    'reason': f'Whole/natural ingredient'
                })
                break
    
    # Bonus for vitamins/minerals
    vitamin_keywords = ['vitamin', 'mineral', 'iron', 'calcium', 'zinc', 'niacin', 'riboflavin', 'thiamin', 'folic acid']
    for ing in ingredients:
        ing_lower = ing.lower()
        for keyword in vitamin_keywords:
            if keyword in ing_lower:
                bonus = SCORING_WEIGHTS['vitamin_mineral']
                score -= bonus
                breakdown.append({
                    'ingredient': ing,
                    'impact': 'positive',
                    'points': abs(bonus),
                    'reason': 'Vitamin/mineral fortification'
                })
                break
    
    # Penalize for high ingredient count
    if ingredient_count > 20:
        penalty = SCORING_WEIGHTS['high_ingredient_count']
        score -= penalty
        breakdown.append({
            'ingredient': 'Ingredient Count',
            'impact': 'caution',
            'points': -penalty,
            'reason': f'{ingredient_count} ingredients (complex formulation)'
        })
    elif ingredient_count > 15:
        penalty = SCORING_WEIGHTS['medium_ingredient_count']
        score -= penalty
        breakdown.append({
            'ingredient': 'Ingredient Count',
            'impact': 'caution',
            'points': -penalty,
            'reason': f'{ingredient_count} ingredients (moderate complexity)'
        })
    
    final_score = max(0, min(100, score))
    return final_score, breakdown

def calculate_health_risk_score(additives, allergens):
    """
    Calculate health risk score (0-100) with detailed breakdown
    """
    score = 0
    breakdown = []
    
    # Add points for additives
    for additive in additives:
        risk_level = additive["riskLevel"]
        if risk_level == "high":
            points = 20
        elif risk_level == "medium":
            points = 10
        else:
            points = 3
        
        score += points
        breakdown.append({
            'ingredient': additive['name'],
            'impact': 'negative',
            'points': points,
            'reason': f"{risk_level.capitalize()} risk {additive.get('type', 'additive')}"
        })
    
    # Add points for detected allergens
    detected_allergens = [a for a in allergens if a["detected"]]
    for allergen in detected_allergens:
        points = SCORING_WEIGHTS['allergen_penalty']
        score += points
        breakdown.append({
            'ingredient': allergen['name'],
            'impact': 'negative',
            'points': points,
            'reason': f"Allergen detected: {', '.join(allergen.get('matchedKeywords', []))}"
        })
    
    final_score = min(100, score)
    return final_score, breakdown

def get_top_ingredients(ingredients, top_n=5):
    """
    Get top N ingredients with frequency count
    """
    from collections import Counter
    
    # Count ingredient frequency
    counter = Counter(ingredients)
    total = len(ingredients)
    
    # Get top N
    top = []
    for name, count in counter.most_common(top_n):
        top.append({
            "name": name,
            "count": count,
            "percentage": round((count / total) * 100, 2)
        })
    
    return top
