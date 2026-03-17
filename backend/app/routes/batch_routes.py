from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import io
from datetime import datetime
from app.services.allergen_engine import detect_allergens
from app.services.additive_engine import detect_additives
from app.services.scoring_engine import parse_ingredients, calculate_clean_label_score, calculate_health_risk_score
from app.services.ml_service import ml_service

batch_bp = Blueprint('batch', __name__, url_prefix='/api/batch')

@batch_bp.route('/analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple products from CSV"""
    try:
        if 'file' not in request.files:
            return jsonify({'message': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400
        
        # Read CSV
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            return jsonify({'message': 'Invalid file format. Use CSV or XLSX'}), 400
        
        # Validate columns
        if 'product_name' not in df.columns or 'ingredients' not in df.columns:
            return jsonify({'message': 'CSV must have product_name and ingredients columns'}), 400
        
        # Limit rows
        if len(df) > 1000:
            return jsonify({'message': 'Maximum 1000 rows allowed'}), 400
        
        # Process each row
        results = []
        for idx, row in df.iterrows():
            product_name = row['product_name']
            ingredient_text = str(row['ingredients'])
            
            # Analyze
            ingredients = parse_ingredients(ingredient_text)
            allergens = detect_allergens(ingredient_text)
            additives = detect_additives(ingredient_text)
            clean_score, _ = calculate_clean_label_score(ingredients, additives)
            health_score, _ = calculate_health_risk_score(additives, allergens)
            
            # Predict category
            category_pred = ml_service.predict_category(ingredient_text)
            category = category_pred['predicted_category'] if category_pred else 'Unknown'
            confidence = category_pred['confidence'] if category_pred else 0
            
            # Detected allergens
            detected_allergens = [a['name'] for a in allergens if a['detected']]
            
            results.append({
                'product_name': product_name,
                'ingredient_count': len(ingredients),
                'clean_label_score': clean_score,
                'health_risk_score': health_score,
                'additive_count': len(additives),
                'allergen_count': len(detected_allergens),
                'detected_allergens': ', '.join(detected_allergens) if detected_allergens else 'None',
                'predicted_category': category,
                'category_confidence': round(confidence * 100, 2)
            })
        
        # Create result DataFrame
        result_df = pd.DataFrame(results)
        
        # Convert to CSV
        output = io.BytesIO()
        result_df.to_csv(output, index=False)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'batch_analysis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    
    except Exception as e:
        return jsonify({'message': f'Batch analysis failed: {str(e)}'}), 500

@batch_bp.route('/template', methods=['GET'])
def download_template():
    """Download CSV template"""
    try:
        template_data = {
            'product_name': ['Chocolate Bar', 'Protein Shake', 'Granola Bar'],
            'ingredients': [
                'sugar, cocoa butter, milk powder, soy lecithin',
                'whey protein, water, sucralose, xanthan gum',
                'oats, honey, almonds, coconut oil, vanilla extract'
            ]
        }
        df = pd.DataFrame(template_data)
        
        output = io.BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name='batch_template.csv'
        )
    except Exception as e:
        return jsonify({'message': f'Template download failed: {str(e)}'}), 500
