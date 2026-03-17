import pandas as pd
import numpy as np
import os
from pathlib import Path

# Create output directory
OUTPUT_DIR = Path('indian_data')
OUTPUT_DIR.mkdir(exist_ok=True)

print("=" * 80)
print("INDIAN NUTRITION DATABASE - DATA PROCESSING PIPELINE")
print("=" * 80)

# Load dataset
df = pd.read_excel('dataset/Anuvaad_INDB_2024.11.xlsx')
print(f"\nLoaded: {df.shape[0]} rows, {df.shape[1]} columns")

# 1. DATA CLEANING
print("\n[1/6] Data Cleaning...")
df_clean = df.copy()

# Remove rows with missing food names
df_clean = df_clean.dropna(subset=['food_name'])

# Fill missing numeric values with 0 (nutrients not present)
numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
df_clean[numeric_cols] = df_clean[numeric_cols].fillna(0)

# Fill missing categorical with 'Unknown'
categorical_cols = df_clean.select_dtypes(include=['object']).columns
df_clean[categorical_cols] = df_clean[categorical_cols].fillna('Unknown')

print(f"   Cleaned: {df_clean.shape[0]} rows retained")

# 2. CATEGORIZATION
print("\n[2/6] Categorizing Foods...")

def categorize_food(name):
    name_lower = str(name).lower()
    
    # Beverages
    if any(x in name_lower for x in ['tea', 'coffee', 'juice', 'drink', 'beverage', 'milk', 'lassi', 'sharbat', 'panna']):
        return 'Beverages'
    
    # Grains & Cereals
    if any(x in name_lower for x in ['rice', 'wheat', 'roti', 'chapati', 'bread', 'cereal', 'grain', 'flour', 'atta']):
        return 'Grains & Cereals'
    
    # Pulses & Legumes
    if any(x in name_lower for x in ['dal', 'lentil', 'bean', 'chickpea', 'pulse', 'legume', 'moong', 'masoor', 'chana']):
        return 'Pulses & Legumes'
    
    # Vegetables
    if any(x in name_lower for x in ['vegetable', 'sabzi', 'gourd', 'spinach', 'potato', 'tomato', 'onion', 'palak', 'aloo']):
        return 'Vegetables'
    
    # Fruits
    if any(x in name_lower for x in ['fruit', 'mango', 'banana', 'apple', 'orange', 'aam', 'kela', 'papaya']):
        return 'Fruits'
    
    # Dairy
    if any(x in name_lower for x in ['paneer', 'cheese', 'curd', 'yogurt', 'ghee', 'butter', 'dahi']):
        return 'Dairy Products'
    
    # Meat & Fish
    if any(x in name_lower for x in ['chicken', 'mutton', 'fish', 'egg', 'meat', 'prawn', 'seafood']):
        return 'Meat & Seafood'
    
    # Snacks & Sweets
    if any(x in name_lower for x in ['sweet', 'snack', 'namkeen', 'ladoo', 'halwa', 'barfi', 'pakora', 'samosa']):
        return 'Snacks & Sweets'
    
    # Spices & Condiments
    if any(x in name_lower for x in ['spice', 'masala', 'chutney', 'pickle', 'sauce', 'paste']):
        return 'Spices & Condiments'
    
    return 'Other'

df_clean['category'] = df_clean['food_name'].apply(categorize_food)
print(f"   Categories: {df_clean['category'].value_counts().to_dict()}")

# 3. FEATURE ENGINEERING
print("\n[3/6] Feature Engineering...")

# Macronutrient ratios
df_clean['protein_ratio'] = df_clean['protein_g'] / (df_clean['protein_g'] + df_clean['fat_g'] + df_clean['carb_g'] + 0.001)
df_clean['fat_ratio'] = df_clean['fat_g'] / (df_clean['protein_g'] + df_clean['fat_g'] + df_clean['carb_g'] + 0.001)
df_clean['carb_ratio'] = df_clean['carb_g'] / (df_clean['protein_g'] + df_clean['fat_g'] + df_clean['carb_g'] + 0.001)

# Calorie density (kcal per 100g)
df_clean['calorie_density'] = df_clean['energy_kcal']

# Nutrient density scores (using available columns)
df_clean['mineral_score'] = (
    df_clean['calcium_mg']/10 + df_clean['iron_mg'] + df_clean['zinc_mg'] + 
    df_clean['magnesium_mg']/10 + df_clean['phosphorus_mg']/10
)

df_clean['micronutrient_density'] = (
    df_clean['calcium_mg'] + df_clean['iron_mg']*10 + df_clean['zinc_mg']*10 + 
    df_clean['potassium_mg']/10
)

# Health labels
df_clean['high_protein'] = (df_clean['protein_g'] >= 10).astype(int)
df_clean['high_fiber'] = (df_clean['fibre_g'] >= 5).astype(int)
df_clean['low_calorie'] = (df_clean['energy_kcal'] <= 100).astype(int)
df_clean['high_sugar'] = (df_clean['freesugar_g'] >= 10).astype(int)

print("   Added 10 engineered features")

# 4. SAVE PROCESSED DATASETS
print("\n[4/6] Saving Processed Datasets...")

# Master dataset
df_clean.to_csv(OUTPUT_DIR / 'indian_foods_master.csv', index=False)
print(f"   Saved: indian_foods_master.csv ({df_clean.shape[0]} rows)")

# Category-wise datasets
for category in df_clean['category'].unique():
    cat_df = df_clean[df_clean['category'] == category]
    filename = f"category_{category.lower().replace(' ', '_').replace('&', 'and')}.csv"
    cat_df.to_csv(OUTPUT_DIR / filename, index=False)
    print(f"   Saved: {filename} ({cat_df.shape[0]} rows)")

# 5. ML-READY DATASETS
print("\n[5/6] Creating ML-Ready Datasets...")

# Dataset 1: Calorie Prediction (Regression)
calorie_features = ['protein_g', 'fat_g', 'carb_g', 'fibre_g', 'freesugar_g']
calorie_target = 'energy_kcal'
df_calorie = df_clean[calorie_features + [calorie_target, 'food_name']].copy()
df_calorie.to_csv(OUTPUT_DIR / 'ml_calorie_prediction.csv', index=False)
print(f"   Saved: ml_calorie_prediction.csv (Regression)")

# Dataset 2: Health Classification (Multi-label)
health_features = ['energy_kcal', 'protein_g', 'fat_g', 'carb_g', 'fibre_g', 'freesugar_g', 
                   'calcium_mg', 'iron_mg', 'sodium_mg']
health_targets = ['high_protein', 'high_fiber', 'low_calorie', 'high_sugar']
df_health = df_clean[health_features + health_targets + ['food_name']].copy()
df_health.to_csv(OUTPUT_DIR / 'ml_health_classification.csv', index=False)
print(f"   Saved: ml_health_classification.csv (Classification)")

# Dataset 3: Category Prediction
category_features = ['energy_kcal', 'protein_g', 'fat_g', 'carb_g', 'fibre_g', 
                     'calcium_mg', 'iron_mg', 'mineral_score', 'micronutrient_density']
df_category = df_clean[category_features + ['category', 'food_name']].copy()
df_category.to_csv(OUTPUT_DIR / 'ml_category_prediction.csv', index=False)
print(f"   Saved: ml_category_prediction.csv (Classification)")

# Dataset 4: Nutrient Clustering
cluster_features = ['protein_ratio', 'fat_ratio', 'carb_ratio', 'calorie_density', 
                    'mineral_score', 'micronutrient_density', 'fibre_g']
df_cluster = df_clean[cluster_features + ['food_name', 'category']].copy()
df_cluster.to_csv(OUTPUT_DIR / 'ml_nutrient_clustering.csv', index=False)
print(f"   Saved: ml_nutrient_clustering.csv (Clustering)")

# Dataset 5: Integration with Current Model (Additives Prediction Format)
# Map to similar structure as current model
integration_features = [
    'food_name', 'category', 'energy_kcal', 'protein_g', 'fat_g', 'carb_g', 
    'fibre_g', 'calcium_mg', 'iron_mg', 'sodium_mg',
    'high_protein', 'high_fiber', 'low_calorie', 'high_sugar'
]
df_integration = df_clean[integration_features].copy()
df_integration.to_csv(OUTPUT_DIR / 'integration_current_model.csv', index=False)
print(f"   Saved: integration_current_model.csv (Current Model Format)")

# 6. GENERATE SUMMARY REPORT
print("\n[6/6] Generating Summary Report...")

report = []
report.append("=" * 80)
report.append("INDIAN NUTRITION DATABASE - PROCESSING REPORT")
report.append("=" * 80)
report.append(f"\nSource: Anuvaad_INDB_2024.11.xlsx")
report.append(f"Total Foods Processed: {df_clean.shape[0]}")
report.append(f"Total Features: {df_clean.shape[1]}")
report.append(f"\n--- CATEGORY DISTRIBUTION ---")
for cat, count in df_clean['category'].value_counts().items():
    report.append(f"{cat}: {count} items ({count/len(df_clean)*100:.1f}%)")

report.append(f"\n--- NUTRITIONAL SUMMARY ---")
report.append(f"Avg Calories: {df_clean['energy_kcal'].mean():.1f} kcal")
report.append(f"Avg Protein: {df_clean['protein_g'].mean():.1f}g")
report.append(f"Avg Fat: {df_clean['fat_g'].mean():.1f}g")
report.append(f"Avg Carbs: {df_clean['carb_g'].mean():.1f}g")
report.append(f"Avg Fiber: {df_clean['fibre_g'].mean():.1f}g")

report.append(f"\n--- HEALTH LABELS ---")
report.append(f"High Protein Foods: {df_clean['high_protein'].sum()} ({df_clean['high_protein'].sum()/len(df_clean)*100:.1f}%)")
report.append(f"High Fiber Foods: {df_clean['high_fiber'].sum()} ({df_clean['high_fiber'].sum()/len(df_clean)*100:.1f}%)")
report.append(f"Low Calorie Foods: {df_clean['low_calorie'].sum()} ({df_clean['low_calorie'].sum()/len(df_clean)*100:.1f}%)")
report.append(f"High Sugar Foods: {df_clean['high_sugar'].sum()} ({df_clean['high_sugar'].sum()/len(df_clean)*100:.1f}%)")

report.append(f"\n--- ML DATASETS CREATED ---")
report.append("1. ml_calorie_prediction.csv - Regression model for calorie estimation")
report.append("2. ml_health_classification.csv - Multi-label health classification")
report.append("3. ml_category_prediction.csv - Food category prediction")
report.append("4. ml_nutrient_clustering.csv - Unsupervised nutrient profiling")
report.append("5. integration_current_model.csv - Ready for current model integration")

report.append(f"\n--- INTEGRATION OPTIONS ---")
report.append("Option 1: Extend Current Model - Add Indian foods to existing additives model")
report.append("Option 2: Separate Indian Model - Train dedicated model for Indian cuisine")
report.append("Option 3: Hybrid Approach - Use ensemble of both models with region detection")

report.append(f"\n--- RECOMMENDED NEXT STEPS ---")
report.append("1. Train calorie prediction model (R² expected: >0.95)")
report.append("2. Build health classification model (Accuracy expected: >85%)")
report.append("3. Create nutrient clustering (K=5-8 clusters recommended)")
report.append("4. Integrate with existing API as '/api/analyze/indian' endpoint")
report.append("5. Add region selector in frontend (Global/Indian)")

report.append("\n" + "=" * 80)

report_text = "\n".join(report)
print(report_text)

with open(OUTPUT_DIR / 'PROCESSING_REPORT.txt', 'w', encoding='utf-8') as f:
    f.write(report_text)

print(f"\nReport saved: indian_data/PROCESSING_REPORT.txt")
print("\n" + "=" * 80)
print("PROCESSING COMPLETE - All datasets ready for ML training!")
print("=" * 80)
