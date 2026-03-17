import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.neighbors import NearestNeighbors

BASE_DIR = Path(__file__).parent.parent
DATA_PATH = BASE_DIR / "diet_recommendation_dataset" / "diet_recommendation_dataset.csv"
ML_PATH = BASE_DIR / "diet_recommendation_dataset" / "ml_food_features.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

print("Loading Enriched Diet Recommendation Datasets...")
try:
    master_df = pd.read_csv(DATA_PATH)
    ml_df = pd.read_csv(ML_PATH)
except FileNotFoundError:
    print("Error: Required datasets not found. Run dataset prep first.")
    exit(1)

print(f"Master Dataset Size: {len(master_df)}")
print(f"ML Features Size: {len(ml_df)}")

# For nearest neighbors, we want to scale numeric macronutrients and micro requirements 
# appropriately so the 'distances' are meaningful mathematically.
feature_cols = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'oxalate', 'glycemic_index']

# Drop entirely null rows explicitly if they exist
working_df = master_df.dropna(subset=feature_cols).copy()
print(f"Applying pipeline training to {len(working_df)} pristine entries...")

# 1. Feature Scaling
print("Training Standard Scaler for Nutrient Ratios...")
scaler = StandardScaler()
scaled_features = scaler.fit_transform(working_df[feature_cols])

# 2. Nearest Neighbors Model
# Algorithm: kd_tree/ball_tree for fast multi-dimensional spatial lookups
print("Training NearestNeighbors KD-Tree Algorithm...")
nn_model = NearestNeighbors(n_neighbors=50, algorithm='kd_tree', metric='euclidean')
nn_model.fit(scaled_features)

# 3. Categorical Encoders/Dictionaries (For the constraints engine)
print("Extracting Categorical Encoders...")
diet_types = working_df['diet_type'].dropna().unique().tolist()
meal_types = working_df['meal_type'].dropna().unique().tolist()
cuisines = working_df['cuisine'].dropna().unique().tolist()

# 4. Save Artifacts
print("Saving ML Models and Pickles...")

with open(MODEL_DIR / 'diet_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

with open(MODEL_DIR / 'diet_nn_model.pkl', 'wb') as f:
    pickle.dump(nn_model, f)
    
# We must save the reference index alongside the model so the nearest neighbors index 
# maps accurately to an exact food name / constraints mask
working_df.reset_index(drop=True).to_pickle(MODEL_DIR / 'diet_food_matrix.pkl')

meta = {
    "engine_version": "2.0",
    "total_foods_indexed": len(working_df),
    "features_trained": feature_cols,
    "categories": {
        "diet": diet_types,
        "meals": meal_types,
        "cuisines": cuisines
    }
}
with open(MODEL_DIR / 'diet_engine_meta.json', 'w') as f:
    json.dump(meta, f, indent=4)

print("\n--- AI Engine Model Training Complete ---")
print(f"Features: {feature_cols}")
print(f"Saved artifacts to {MODEL_DIR}:")
print(" ✓ diet_scaler.pkl")
print(" ✓ diet_nn_model.pkl")
print(" ✓ diet_food_matrix.pkl")
print(" ✓ diet_engine_meta.json")
