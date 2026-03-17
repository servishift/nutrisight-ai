"""
ML Model Training Pipeline for Phase 3 Features
- Similarity Search: BERT embeddings for ingredient similarity
- Brand Prediction: Multi-class classification for brand prediction
"""

import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Paths
DATASET_DIR = Path(__file__).parent.parent / 'dataset'
MODEL_DIR = Path(__file__).parent.parent / 'models'
MODEL_DIR.mkdir(exist_ok=True)

print("=" * 60)
print("PHASE 3 ML MODEL TRAINING PIPELINE")
print("=" * 60)

# ============================================================================
# 1. LOAD AND PREPARE DATA
# ============================================================================
print("\n[1/5] Loading datasets...")

df = pd.read_csv(DATASET_DIR / 'Food_Ingredient_Intelligence_Database.csv')
print(f"✓ Loaded {len(df):,} products")

branded_df = pd.read_csv(DATASET_DIR / 'FoodData_Central_csv_2025-12-18' / 'branded_food.csv')
print(f"✓ Loaded {len(branded_df):,} branded products")

df_merged = df.merge(
    branded_df[['fdc_id', 'brand_owner', 'ingredients', 'branded_food_category']], 
    on='fdc_id', 
    how='left',
    suffixes=('', '_branded')
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

# ============================================================================
# 2. TRAIN SIMILARITY SEARCH MODEL (BERT EMBEDDINGS)
# ============================================================================
print("\n[2/5] Training Similarity Search Model...")

bert_model = SentenceTransformer('all-MiniLM-L6-v2')
print("✓ Loaded BERT model")

sample_size = min(10000, len(df_clean))
df_sample = df_clean.sample(n=sample_size, random_state=42)

print(f"✓ Generating embeddings for {sample_size:,} products...")
ingredients_list = df_sample['ingredients_clean'].tolist()
embeddings = bert_model.encode(ingredients_list, show_progress_bar=True, batch_size=32)

embeddings_data = {
    'embeddings': embeddings.tolist(),
    'fdc_ids': df_sample['fdc_id'].tolist(),
    'descriptions': df_sample['description'].tolist(),
    'brands': df_sample['brand_clean'].tolist(),
    'categories': df_sample['category_clean'].tolist(),
    'ingredients': ingredients_list
}

with open(MODEL_DIR / 'similarity_embeddings.pkl', 'wb') as f:
    pickle.dump(embeddings_data, f)

print(f"✓ Saved {len(embeddings):,} embeddings")

# ============================================================================
# 3. TRAIN BRAND PREDICTION MODEL
# ============================================================================
print("\n[3/5] Training Brand Prediction Model...")

brand_counts = df_clean['brand_clean'].value_counts()
valid_brands = brand_counts[brand_counts >= 10].index.tolist()
df_brand = df_clean[df_clean['brand_clean'].isin(valid_brands)].copy()

print(f"✓ {len(valid_brands)} brands, {len(df_brand):,} products")

label_encoder = LabelEncoder()
df_brand['brand_encoded'] = label_encoder.fit_transform(df_brand['brand_clean'])

print("✓ Generating embeddings...")
X_ingredients = df_brand['ingredients_clean'].tolist()
X_embeddings = bert_model.encode(X_ingredients, show_progress_bar=True, batch_size=32)
y = df_brand['brand_encoded'].values

X_train, X_test, y_train, y_test = train_test_split(
    X_embeddings, y, test_size=0.2, random_state=42, stratify=y
)

print(f"✓ Train: {len(X_train):,} | Test: {len(X_test):,}")

print("✓ Training Random Forest...")
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✓ Accuracy: {accuracy:.2%}")

with open(MODEL_DIR / 'brand_prediction_model.pkl', 'wb') as f:
    pickle.dump(rf_model, f)

with open(MODEL_DIR / 'brand_label_encoder.pkl', 'wb') as f:
    pickle.dump(label_encoder, f)

print(f"✓ Saved model ({len(label_encoder.classes_)} brands)")

# ============================================================================
# 4. SAVE METADATA
# ============================================================================
print("\n[4/5] Saving metadata...")

metadata = {
    'similarity_search': {
        'model': 'all-MiniLM-L6-v2',
        'embedding_dim': int(embeddings.shape[1]),
        'num_products': len(embeddings)
    },
    'brand_prediction': {
        'model': 'RandomForest',
        'num_brands': len(label_encoder.classes_),
        'accuracy': float(accuracy),
        'top_brands': label_encoder.classes_[:20].tolist()
    }
}

with open(MODEL_DIR / 'model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("✓ Saved metadata")

# ============================================================================
# 5. TEST MODELS
# ============================================================================
print("\n[5/5] Testing models...")

test_ingredient = "wheat flour, sugar, palm oil, salt"
test_embedding = bert_model.encode([test_ingredient])[0]
similarities = np.dot(embeddings, test_embedding)
top_idx = np.argsort(similarities)[-3:][::-1]

print(f"\n✓ Similarity Test: {test_ingredient}")
for idx in top_idx:
    print(f"  - {embeddings_data['descriptions'][idx]} ({similarities[idx]:.3f})")

test_pred = rf_model.predict([test_embedding])
test_proba = rf_model.predict_proba([test_embedding])[0]
top_3 = np.argsort(test_proba)[-3:][::-1]

print(f"\n✓ Brand Prediction Test:")
for idx in top_3:
    brand = label_encoder.inverse_transform([idx])[0]
    print(f"  - {brand} ({test_proba[idx]:.1%})")

print("\n" + "=" * 60)
print("✓ TRAINING COMPLETE!")
print("=" * 60)
