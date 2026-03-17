from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
import pickle
import json
import os
import random
from app.services.email_service import send_diet_plan_email
from app.middleware.security import require_auth_or_anon, require_pro
from app.middleware.auth_middleware import require_auth
from datetime import datetime

# Initialize Blueprint
diet_bp = Blueprint('diet', __name__)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(BASE_DIR, "models")
RULES_PATH = os.path.join(BASE_DIR, "diet_recommendation_dataset", "disease_nutrition_rules.csv")

# Load ML Artifacts
try:
    with open(os.path.join(MODEL_DIR, "diet_scaler.pkl"), "rb") as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "diet_nn_model.pkl"), "rb") as f:
        nn_model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "diet_engine_meta.json"), "r") as f:
        meta = json.load(f)
    
    # Load the DataFrame to act as our index map
    matrix_df = pd.read_pickle(os.path.join(MODEL_DIR, "diet_food_matrix.pkl"))
    rules_df = pd.read_csv(RULES_PATH)
except Exception as e:
    print(f"Warning: ML Diet Engine files missing or corrupted: {e}")
    scaler, nn_model, meta, matrix_df, rules_df = None, None, None, None, None

def calculate_tdee(weight, height, age, gender, activity_level):
    """Mifflin-St Jeor Equation"""
    if gender.lower() == 'male':
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
        
    activity_multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }
    return int(bmr * activity_multipliers.get(activity_level, 1.2))

@diet_bp.route('/generate', methods=['POST'])
@require_pro
def generate_diet_plan(*args, **kwargs):
    if not all([scaler, nn_model, matrix_df is not None]):
        return jsonify({'error': 'Diet Engine Models not loaded properly. Run training script.'}), 500

    data = request.json
    print(f"DEBUG: Processing diet request: {data}")
    
    try:
        # Extract Patient Profile with safe conversion
        try:
            age = int(data.get('age', 30))
            weight = float(data.get('weight', 70))
            height = float(data.get('height', 170))
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Invalid numeric input: {e}'}), 400

        gender = data.get('gender', 'male')
        activity = data.get('activity_level', 'sedentary')
        goal = data.get('goal', 'maintenance')
        
        conditions = data.get('conditions', [])
        allergies = data.get('allergies', [])
        diet_pref = data.get('diet_preference', 'veg')
        
        # 1. Calculate Target Calories & Macros
        tdee = calculate_tdee(weight, height, age, gender, activity)
        if goal == 'weight_loss': tdee -= 500
        elif goal == 'muscle_gain': tdee += 300
        
        # New Dynamic Macro Splits
        active_conditions = [c.lower() for c in conditions]
        
        if 'pcos' in active_conditions:
            # Lower carb, slightly higher protein/fat for PCOS
            p_pct, c_pct, f_pct = 0.25, 0.40, 0.35
        elif 'ckd' in active_conditions or 'kidney disease' in active_conditions:
            # Low protein restriction for Kidney Health (approx 0.8g/kg)
            p_pct, c_pct, f_pct = 0.10, 0.65, 0.25
        elif goal == 'weight_loss':
            p_pct, c_pct, f_pct = 0.25, 0.45, 0.30
        elif goal == 'muscle_gain':
            p_pct, c_pct, f_pct = 0.25, 0.50, 0.25
        else: # maintenance
            p_pct, c_pct, f_pct = 0.20, 0.55, 0.25
            
        target_protein = (tdee * p_pct) / 4
        target_carbs = (tdee * c_pct) / 4
        target_fats = (tdee * f_pct) / 9
        
        print(f"DEBUG: TDEE: {tdee}, Target P/C/F: {target_protein:.1f}/{target_carbs:.1f}/{target_fats:.1f}")

        # 2. Filter Medical Rules
        allowed_foods_df = matrix_df.copy()
        
        if 'diabetes' in [c.lower() for c in conditions]:
            allowed_foods_df = allowed_foods_df[allowed_foods_df['diabetes_safe'] == True]
            allowed_foods_df = allowed_foods_df[allowed_foods_df['glycemic_index'] < 55]
            
        if 'hypertension' in [c.lower() for c in conditions] or 'heart disease' in [c.lower() for c in conditions]:
            allowed_foods_df = allowed_foods_df[allowed_foods_df['heart_healthy'] == True]
            
        if 'kidney stones' in [c.lower() for c in conditions]:
            allowed_foods_df = allowed_foods_df[(allowed_foods_df['oxalate'] < 50) | (allowed_foods_df['oxalate'].isna())]
            
        # 3. Apply Allergies & Preferences
        if diet_pref.lower() == 'vegan':
            allowed_foods_df = allowed_foods_df[allowed_foods_df['diet_type'] == 'vegan']
        elif diet_pref.lower() == 'veg':
            allowed_foods_df = allowed_foods_df[allowed_foods_df['diet_type'].isin(['veg', 'vegan'])]
                
        for alg in allergies:
            allowed_foods_df = allowed_foods_df[~allowed_foods_df['allergens'].str.contains(alg.lower(), na=False)]
            
        print(f"DEBUG: Foods remaining after filters: {len(allowed_foods_df)}")
        if len(allowed_foods_df) == 0:
            return jsonify({'error': 'Strict constraints returned zero food matches. Try relaxing allergies or preferences.'}), 400

        # 4. Meal Distribution & ML query
        num_days = int(data.get('days', 7))
        num_days = max(1, min(num_days, 14)) # Clamp between 1-14 days
        
        meals_dist = [
            {'name': 'Breakfast', 'pct': 0.25, 'type': 'breakfast'},
            {'name': 'Lunch', 'pct': 0.35, 'type': 'none'},
            {'name': 'Dinner', 'pct': 0.30, 'type': 'none'},
            {'name': 'Snack', 'pct': 0.10, 'type': 'side'}
        ]
        
        weekly_plan = []
        features = meta['features_trained']
        allowed_indices = allowed_foods_df.index
        
        # Precompute full allowed pool for progressive fallback (diet pref only, no medical constraints)
        if diet_pref.lower() == 'vegan':
            fallback_pool_df = matrix_df[matrix_df['diet_type'] == 'vegan']
        elif diet_pref.lower() == 'veg':
            fallback_pool_df = matrix_df[matrix_df['diet_type'].isin(['veg', 'vegan'])]
        else:
            fallback_pool_df = matrix_df
        fallback_indices = set(fallback_pool_df.index)
        
        for day in range(1, num_days + 1):
            day_plan = {"day": day, "meals": [], "daily_calories": 0}
            for meal in meals_dist:
                # Dynamic scaling: For high TDEE profiles, we need more items to reach the target
                if meal['pct'] >= 0.25: # Main meals
                    if tdee > 3000: num_items = 4
                    elif tdee > 2400: num_items = 3
                    else: num_items = 2
                else: # Snacks
                    num_items = 2 if tdee > 2800 else 1
                
                meal_cal_slot = (tdee * meal['pct'])
                meal_prot_slot = (target_protein * meal['pct'])
                meal_carb_slot = (target_carbs * meal['pct'])
                meal_fat_slot = (target_fats * meal['pct'])
                
                for i in range(num_items):
                    # Target per item within the slot
                    target_cal = meal_cal_slot / num_items
                    target_prot = meal_prot_slot / num_items
                    target_carb = meal_carb_slot / num_items
                    target_fat = meal_fat_slot / num_items
                    
                    # Create a target vector for the space
                    target_vector = [target_cal, target_prot, target_carb, target_fat, 5, 2, 50, 0, 40] 
                    
                    target_df = pd.DataFrame([target_vector], columns=features)
                    scaled_target = scaler.transform(target_df)
                    
                    # Expand neighbors significantly for better variety
                    distances, indices = nn_model.kneighbors(scaled_target, n_neighbors=200)
                    
                    # First try: use medically filtered pool
                    valid_indices = [idx for idx in indices[0] if idx in allowed_indices]
                    
                    # Progressive relaxation: if filtered pool is too small, expand to diet preference pool
                    if len(valid_indices) < 3:
                        valid_indices = [idx for idx in indices[0] if idx in fallback_indices]
                    
                    # Last resort: use any of the 200 neighbors
                    if not valid_indices:
                        valid_indices = list(indices[0][:30])
                    
                    if valid_indices:
                        # Choose from a wider pool for variety
                        day_foods = [m['food'].lower() for m in day_plan['meals']]
                        selection_pool = [idx for idx in valid_indices[:min(len(valid_indices), 30)] 
                                         if matrix_df.iloc[idx]['food_name'].lower().title() not in day_foods]
                        
                        if not selection_pool: # Fallback if all top items are already used
                            selection_pool = valid_indices[:min(len(valid_indices), 15)]
                            
                        chosen_idx = random.choice(selection_pool)
                        
                        food_item = matrix_df.iloc[chosen_idx]
                        
                        day_plan['meals'].append({
                            "meal_name": meal['name'],
                            "food": food_item['food_name'].title(),
                            "calories": round(food_item['calories'], 1),
                            "protein": round(food_item['protein'], 1),
                            "carbs": round(food_item['carbs'], 1),
                            "fat": round(food_item['fat'], 1),
                            "gi": round(food_item['glycemic_index'], 1)
                        })
                        day_plan['daily_calories'] += round(food_item['calories'], 1)
                    else:
                        # True empty — use target calories as a nutritionist-estimated item
                        day_plan['meals'].append({
                            "meal_name": meal['name'], 
                            "food": "Balanced Meal (Nutritionist Estimate)", 
                            "calories": round(target_cal, 1),
                            "protein": round(target_prot, 1),
                            "carbs": round(target_carb, 1),
                            "fat": round(target_fat, 1),
                            "gi": 45
                        })
                        day_plan['daily_calories'] += round(target_cal, 1)
            
            # Calorie Floor Guarantee: if under 80% of TDEE add more snack items
            calorie_floor = tdee * 0.80
            topoff_attempts = 0
            while day_plan['daily_calories'] < calorie_floor and topoff_attempts < 6:
                topoff_attempts += 1
                # Pick a high-calorie item from the fallback pool
                topoff_target = [tdee * 0.10, target_protein * 0.10, target_carbs * 0.10, target_fats * 0.10, 5, 2, 50, 0, 40]
                topoff_df = pd.DataFrame([topoff_target], columns=features)
                scaled_topoff = scaler.transform(topoff_df)
                distances_t, indices_t = nn_model.kneighbors(scaled_topoff, n_neighbors=100)
                fallback_items = [idx for idx in indices_t[0] if idx in fallback_indices]
                if not fallback_items:
                    fallback_items = list(indices_t[0][:20])
                if fallback_items:
                    chosen = random.choice(fallback_items[:20])
                    food_item = matrix_df.iloc[chosen]
                    day_plan['meals'].append({
                        "meal_name": "Snack",
                        "food": food_item['food_name'].title(),
                        "calories": round(food_item['calories'], 1),
                        "protein": round(food_item['protein'], 1),
                        "carbs": round(food_item['carbs'], 1),
                        "fat": round(food_item['fat'], 1),
                        "gi": round(food_item['glycemic_index'], 1)
                    })
                    day_plan['daily_calories'] += round(food_item['calories'], 1)
                else:
                    break
            
            weekly_plan.append(day_plan)
            
        report = {
            "patient_info": {
                "tdee": tdee,
                "target_protein": round(target_protein, 1),
                "target_carbs": round(target_carbs, 1),
                "target_fats": round(target_fats, 1),
                "applied_rules": list(conditions) + list(allergies),
                "num_days": num_days,
                "generated_at": datetime.now().isoformat()
            },
            "weekly_plan": weekly_plan
        }
        
        return jsonify(report), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@diet_bp.route('/send-email', methods=['POST'])
@require_auth
def send_diet_plan_via_email(current_user):
    """Send generated diet plan to the authenticated user's own email only"""
    data = request.json

    try:
        # Always use the authenticated user's email — never trust body email
        email = current_user.get('email')
        if not email:
            return jsonify({'error': 'No email associated with your account'}), 400

        patient_name = data.get('patient_name', 'Patient')
        diet_report = data.get('diet_report')
        pdf_base64 = data.get('pdf_data')

        if not diet_report:
            return jsonify({'error': 'Diet report data is required'}), 400

        # Generate HTML for the diet plan
        patient_info = diet_report.get('patient_info', {})
        weekly_plan = diet_report.get('weekly_plan', [])
        
        diet_plan_html = f"""
        <div style="margin: 20px 0;">
            <h4 style="color: #6366f1; margin-bottom: 15px;">Nutrition Targets</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background: #f9f9f9;">
                    <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Target Calories</td>
                    <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">{patient_info.get('tdee', 0)} kcal/day</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Protein</td>
                    <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">{patient_info.get('target_protein', 0)}g/day</td>
                </tr>
                <tr style="background: #f9f9f9;">
                    <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Carbohydrates</td>
                    <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">{patient_info.get('target_carbs', 0)}g/day</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Fats</td>
                    <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">{patient_info.get('target_fats', 0)}g/day</td>
                </tr>
            </table>
        """
        
        if patient_info.get('applied_rules'):
            diet_plan_html += f"""
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107;">
                <strong style="color: #856404;">Applied Constraints:</strong> {', '.join(patient_info.get('applied_rules', []))}
            </div>
            """
        
        diet_plan_html += "<h4 style='color: #6366f1; margin: 25px 0 15px 0;'>7-Day Meal Plan</h4>"
        
        for day in weekly_plan[:3]:  # Show first 3 days in email
            diet_plan_html += f"""
            <div style="margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background: #6366f1; color: white; padding: 12px 15px; font-weight: bold;">
                    Day {day.get('day', 1)} - Total: {day.get('daily_calories', 0)} kcal
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f9f9f9;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">Meal</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">Food</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Calories</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Protein</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            
            for meal in day.get('meals', []):
                diet_plan_html += f"""
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">{meal.get('meal_name', '')}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #6366f1;">{meal.get('food', '')}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">{meal.get('calories', 0)}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">{meal.get('protein', 0)}g</td>
                        </tr>
                """
            
            diet_plan_html += """
                    </tbody>
                </table>
            </div>
            """
        
        if len(weekly_plan) > 3:
            diet_plan_html += f"""
            <p style="color: #666; font-style: italic; margin-top: 15px;">
                ... and {len(weekly_plan) - 3} more days. View the complete plan in your dashboard.
            </p>
            """
        
        diet_plan_html += "</div>"
        
        # Decode PDF if provided
        pdf_data = None
        if pdf_base64:
            import base64
            try:
                pdf_data = base64.b64decode(pdf_base64)
            except Exception as e:
                print(f"Failed to decode PDF: {e}")
        
        # Send email
        success = send_diet_plan_email(email, patient_name, diet_plan_html, pdf_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Diet plan sent successfully to {email}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to send email. Please check your email configuration.'
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
