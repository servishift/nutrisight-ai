"""
Phase 3 ML Training - Simplified (No BERT, uses TF-IDF)
Works without sentence-transformers to avoid Windows Long Path issues
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import accuracy_score
import pickle
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

DATASET_DIR = Path(__file__).parent.parent / 'dataset'
MODEL_DIR = Path(__file__).parent.parent / 'models'
MODEL_DIR.mkdir(exist_ok=True)

print("=" * 60)
print("PHASE 3 ML TRAINING (TF-IDF)")
print("=" * 60)

# Load data
print("\n[1/4] Loading data...")
df = pd.read_csv(DATASET_DIR / 'Food_Ingredient_Intelligence_Database.csv')
branded_df = pd.read_csv(DATASET_DIR / 'FoodData_Central_csv_2025-12-18' / 'branded_food.csv')

df_merged = df.merge(
    branded_df[['fdc_id', 'brand_owner', 'ingredients', 'branded_food_category']], 
    on='fdc_id', how='left', suffixes=('', '_branded')
)

df_merged['ingredients_clean'] = df_merged['ingredients'].fillna(df_merged['ingredients_branded'])
df_merged['brand_clean'] = df_merged['brand_owner'].fillna(df_merged['brand_owner'])
df_merged['category_clean'] = df_merged['food_category'].fillna(df_merged['branded_food_category'])

df_clean = df_merged[
    df_merged['ingredients_clean'].notna() & 
    df_merged['brand_clean'].notna() &
    (df_merged['ingredients_clean'].str.len() > 10)
].copy()

print(f"✓ Cleaned: {len(df_clean):,} products")

# Similarity Search Model
print("\n[2/4] Training Similarity Search (TF-IDF)...")
sample_size = min(10000, len(df_clean))
df_sample = df_clean.sample(n=sample_size, random_state=42)

vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2))
tfidf_matrix = vectorizer.fit_transform(df_sample['ingredients_clean'])

similarity_data = {
    'vectorizer': vectorizer,
    'tfidf_matrix': tfidf_matrix,
    'fdc_ids': df_sample['fdc_id'].tolist(),
    'descriptions': df_sample['description'].tolist(),
    'brands': df_sample['brand_clean'].tolist(),
    'categories': df_sample['category_clean'].tolist(),
    'ingredients': df_sample['ingredients_clean'].tolist()
}

with open(MODEL_DIR / 'similarity_tfidf.pkl', 'wb') as f:
    pickle.dump(similarity_data, f)

print(f"✓ Saved TF-IDF model ({tfidf_matrix.shape[1]} features)")

# Brand Prediction Model
print("\n[3/4] Training Brand Prediction...")
brand_counts = df_clean['brand_clean'].value_counts()
valid_brands = brand_counts[brand_counts >= 10].index.tolist()
df_brand = df_clean[df_clean['brand_clean'].isin(valid_brands)].copy()

print(f"✓ {len(valid_brands)} brands, {len(df_brand):,} products")

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df_brand['brand_clean'])

X_tfidf = vectorizer.transform(df_brand['ingredients_clean'])
X_train, X_test, y_train, y_test = train_test_split(
    X_tfidf, y, test_size=0.2, random_state=42, stratify=y
)

rf_model = RandomForestClassifier(n_estimators=100, max_depth=20, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)

accuracy = accuracy_score(y_test, rf_model.predict(X_test))
print(f"✓ Accuracy: {accuracy:.2%}")

with open(MODEL_DIR / 'brand_prediction_tfidf.pkl', 'wb') as f:
    pickle.dump({'model': rf_model, 'encoder': label_encoder}, f)

# Save metadata
print("\n[4/4] Saving metadata...")
metadata = {
    'similarity_search': {
        'model': 'TF-IDF',
        'features': tfidf_matrix.shape[1],
        'num_products': len(df_sample)
    },
    'brand_prediction': {
        'model': 'RandomForest',
        'num_brands': len(label_encoder.classes_),
        'accuracy': float(accuracy),
        'top_brands': label_encoder.classes_[:20].tolist()
    }
}

with open(MODEL_DIR / 'phase3_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

# Test
print("\n[TEST] Testing models...")
test_ing = "wheat flour, sugar, palm oil, salt"
test_vec = vectorizer.transform([test_ing])
similarities = cosine_similarity(test_vec, tfidf_matrix)[0]
top_3 = np.argsort(similarities)[-3:][::-1]

print(f"\nSimilarity Test: {test_ing}")
for idx in top_3:
    print(f"  - {similarity_data['descriptions'][idx]} ({similarities[idx]:.3f})")

proba = rf_model.predict_proba(test_vec)[0]
top_brands = np.argsort(proba)[-3:][::-1]

print(f"\nBrand Prediction:")
for idx in top_brands:
    print(f"  - {label_encoder.inverse_transform([idx])[0]} ({proba[idx]:.1%})")

print("\n" + "=" * 60)
print("✓ TRAINING COMPLETE!")
print("=" * 60)
print(f"\nFiles: similarity_tfidf.pkl, brand_prediction_tfidf.pkl, phase3_metadata.json")
