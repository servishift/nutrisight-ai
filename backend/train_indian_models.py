import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, classification_report, accuracy_score
from sklearn.cluster import KMeans
import joblib
from pathlib import Path

OUTPUT_DIR = Path('indian_data/models')
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

print("=" * 80)
print("INDIAN NUTRITION ML MODELS - TRAINING PIPELINE")
print("=" * 80)

# MODEL 1: CALORIE PREDICTION (REGRESSION)
print("\n[1/4] Training Calorie Prediction Model...")
df_cal = pd.read_csv('indian_data/ml_calorie_prediction.csv')
X = df_cal[['protein_g', 'fat_g', 'carb_g', 'fibre_g', 'freesugar_g']]
y = df_cal['energy_kcal']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model_cal = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
model_cal.fit(X_train, y_train)

y_pred = model_cal.predict(X_test)
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"   R² Score: {r2:.4f}")
print(f"   RMSE: {rmse:.2f} kcal")
print(f"   Feature Importance:")
for feat, imp in zip(X.columns, model_cal.feature_importances_):
    print(f"      {feat}: {imp:.3f}")

joblib.dump(model_cal, OUTPUT_DIR / 'calorie_predictor.pkl')
print("   Saved: calorie_predictor.pkl")

# MODEL 2: HEALTH CLASSIFICATION
print("\n[2/4] Training Health Classification Model...")
df_health = pd.read_csv('indian_data/ml_health_classification.csv')
X = df_health[['energy_kcal', 'protein_g', 'fat_g', 'carb_g', 'fibre_g', 
               'freesugar_g', 'calcium_mg', 'iron_mg', 'sodium_mg']]

results = {}
for target in ['high_protein', 'high_fiber', 'low_calorie', 'high_sugar']:
    y = df_health[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=8)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    results[target] = acc
    
    joblib.dump(model, OUTPUT_DIR / f'health_{target}.pkl')
    print(f"   {target}: Accuracy = {acc:.3f}")

print(f"   Average Accuracy: {np.mean(list(results.values())):.3f}")

# MODEL 3: CATEGORY PREDICTION
print("\n[3/4] Training Category Prediction Model...")
df_cat = pd.read_csv('indian_data/ml_category_prediction.csv')
X = df_cat[['energy_kcal', 'protein_g', 'fat_g', 'carb_g', 'fibre_g', 
            'calcium_mg', 'iron_mg', 'mineral_score', 'micronutrient_density']]
y = df_cat['category']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model_cat = RandomForestClassifier(n_estimators=150, random_state=42, max_depth=12)
model_cat.fit(X_train, y_train)

y_pred = model_cat.predict(X_test)
acc = accuracy_score(y_test, y_pred)

print(f"   Accuracy: {acc:.3f}")
print(f"   Categories: {list(model_cat.classes_)}")

joblib.dump(model_cat, OUTPUT_DIR / 'category_predictor.pkl')
print("   Saved: category_predictor.pkl")

# MODEL 4: NUTRIENT CLUSTERING
print("\n[4/4] Training Nutrient Clustering Model...")
df_cluster = pd.read_csv('indian_data/ml_nutrient_clustering.csv')
X = df_cluster[['protein_ratio', 'fat_ratio', 'carb_ratio', 'calorie_density', 
                'mineral_score', 'micronutrient_density', 'fibre_g']]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

model_cluster = KMeans(n_clusters=6, random_state=42, n_init=10)
clusters = model_cluster.fit_predict(X_scaled)

df_cluster['cluster'] = clusters
df_cluster.to_csv('indian_data/clustered_foods.csv', index=False)

print(f"   Clusters: {model_cluster.n_clusters}")
print(f"   Inertia: {model_cluster.inertia_:.2f}")
for i in range(model_cluster.n_clusters):
    count = (clusters == i).sum()
    print(f"      Cluster {i}: {count} foods")

joblib.dump(model_cluster, OUTPUT_DIR / 'nutrient_clusterer.pkl')
joblib.dump(scaler, OUTPUT_DIR / 'cluster_scaler.pkl')
print("   Saved: nutrient_clusterer.pkl, cluster_scaler.pkl")

# SAVE MODEL METADATA
metadata = {
    'calorie_prediction': {
        'model': 'RandomForestRegressor',
        'r2_score': float(r2),
        'rmse': float(rmse),
        'features': list(X.columns)
    },
    'health_classification': {
        'model': 'RandomForestClassifier',
        'targets': list(results.keys()),
        'accuracies': {k: float(v) for k, v in results.items()},
        'avg_accuracy': float(np.mean(list(results.values())))
    },
    'category_prediction': {
        'model': 'RandomForestClassifier',
        'accuracy': float(acc),
        'categories': list(model_cat.classes_)
    },
    'nutrient_clustering': {
        'model': 'KMeans',
        'n_clusters': int(model_cluster.n_clusters),
        'inertia': float(model_cluster.inertia_)
    }
}

import json
with open(OUTPUT_DIR / 'model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("\n" + "=" * 80)
print("TRAINING COMPLETE - All models saved in indian_data/models/")
print("=" * 80)
