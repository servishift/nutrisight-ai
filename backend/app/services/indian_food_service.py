"""
Indian Food Service
Loads Indian food data from Neon DB (falls back to CSV if DB unavailable).
"""
import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from functools import lru_cache


def _get_engine():
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    try:
        from sqlalchemy import create_engine
        return create_engine(url, connect_args={"sslmode": "require"}, pool_pre_ping=True)
    except Exception as e:
        print(f"[IndianFood] DB engine error: {e}")
        return None


@lru_cache(maxsize=1)
def _load_indian_foods():
    engine = _get_engine()
    if engine:
        try:
            df = pd.read_sql_table("indian_foods", engine)
            print(f"[IndianFood] Loaded {len(df):,} rows from Neon: indian_foods")
            return df
        except Exception as e:
            print(f"[IndianFood] Neon read failed (indian_foods): {e}")
    path = Path("indian_data/indian_foods_master.csv")
    print(f"[IndianFood] CSV fallback: {path}")
    return pd.read_csv(path)


@lru_cache(maxsize=1)
def _load_clustered_foods():
    engine = _get_engine()
    if engine:
        try:
            df = pd.read_sql_table("indian_foods_clustered", engine)
            print(f"[IndianFood] Loaded {len(df):,} rows from Neon: indian_foods_clustered")
            return df
        except Exception as e:
            print(f"[IndianFood] Neon read failed (indian_foods_clustered): {e}")
    path = Path("indian_data/clustered_foods.csv")
    print(f"[IndianFood] CSV fallback: {path}")
    return pd.read_csv(path)


class IndianFoodAnalyzer:
    def __init__(self):
        self.models_dir = Path("indian_data/models")
        self._load_models()
        self.foods_db = _load_indian_foods()
        self.clustered_foods = _load_clustered_foods()

    def _load_models(self):
        self.calorie_model  = joblib.load(self.models_dir / "calorie_predictor.pkl")
        self.category_model = joblib.load(self.models_dir / "category_predictor.pkl")
        self.cluster_model  = joblib.load(self.models_dir / "nutrient_clusterer.pkl")
        self.cluster_scaler = joblib.load(self.models_dir / "cluster_scaler.pkl")
        self.health_models  = {
            t: joblib.load(self.models_dir / f"health_{t}.pkl")
            for t in ["high_protein", "high_fiber", "low_calorie", "high_sugar"]
        }

    def predict_calories(self, nutrients):
        features = pd.DataFrame([[
            nutrients.get("protein_g", 0), nutrients.get("fat_g", 0),
            nutrients.get("carb_g", 0),    nutrients.get("fibre_g", 0),
            nutrients.get("freesugar_g", 0),
        ]], columns=["protein_g", "fat_g", "carb_g", "fibre_g", "freesugar_g"])
        return float(self.calorie_model.predict(features)[0])

    def predict_health_labels(self, nutrients):
        features = pd.DataFrame([[
            nutrients.get("energy_kcal", 0), nutrients.get("protein_g", 0),
            nutrients.get("fat_g", 0),       nutrients.get("carb_g", 0),
            nutrients.get("fibre_g", 0),     nutrients.get("freesugar_g", 0),
            nutrients.get("calcium_mg", 0),  nutrients.get("iron_mg", 0),
            nutrients.get("sodium_mg", 0),
        ]], columns=["energy_kcal", "protein_g", "fat_g", "carb_g", "fibre_g",
                     "freesugar_g", "calcium_mg", "iron_mg", "sodium_mg"])
        return {t: bool(m.predict(features)[0]) for t, m in self.health_models.items()}

    def predict_category(self, nutrients):
        energy_kcal   = nutrients.get("energy_kcal", 0)
        protein_g     = nutrients.get("protein_g", 0)
        fat_g         = nutrients.get("fat_g", 0)
        carb_g        = nutrients.get("carb_g", 0)
        fibre_g       = nutrients.get("fibre_g", 0)
        freesugar_g   = nutrients.get("freesugar_g", 0)
        calcium_mg    = nutrients.get("calcium_mg", 0)
        iron_mg       = nutrients.get("iron_mg", 0)
        sodium_mg     = nutrients.get("sodium_mg", 0)
        phosphorus_mg = nutrients.get("phosphorus_mg", 0)
        magnesium_mg  = nutrients.get("magnesium_mg", 0)
        potassium_mg  = nutrients.get("potassium_mg", 0)

        total_macro   = protein_g + fat_g + carb_g
        protein_ratio = protein_g / total_macro if total_macro > 0 else 0
        fat_ratio     = fat_g     / total_macro if total_macro > 0 else 0
        carb_ratio    = carb_g    / total_macro if total_macro > 0 else 0
        fiber_density   = (fibre_g   / energy_kcal * 100) if energy_kcal > 0 else 0
        protein_density = (protein_g / energy_kcal * 100) if energy_kcal > 0 else 0
        mineral_score   = calcium_mg * 0.1 + iron_mg * 2 + sodium_mg * 0.01

        features = pd.DataFrame([[
            energy_kcal, protein_g, fat_g, carb_g, fibre_g, freesugar_g,
            calcium_mg, iron_mg, sodium_mg, phosphorus_mg, magnesium_mg, potassium_mg,
            protein_ratio, fat_ratio, carb_ratio, fiber_density, protein_density, mineral_score,
        ]], columns=[
            "energy_kcal", "protein_g", "fat_g", "carb_g", "fibre_g", "freesugar_g",
            "calcium_mg", "iron_mg", "sodium_mg", "phosphorus_mg", "magnesium_mg", "potassium_mg",
            "protein_ratio", "fat_ratio", "carb_ratio", "fiber_density", "protein_density", "mineral_score",
        ])

        # Rule-based overrides
        if carb_ratio > 0.75 and energy_kcal > 100 and protein_ratio < 0.15:
            return "Grains & Cereals"
        if protein_ratio > 0.2 and fibre_g > 5:
            return "Pulses & Legumes"
        if calcium_mg > 150 and fat_g > 5 and protein_ratio > 0.15:
            return "Dairy Products"
        if protein_ratio > 0.35 and fat_g > 10:
            return "Meat & Seafood"
        if energy_kcal < 50 and fibre_g > 2 and carb_g < 10:
            return "Vegetables"
        if energy_kcal < 50 and carb_g < 5:
            return "Beverages"
        if freesugar_g > 5 and fibre_g > 2 and energy_kcal < 100:
            return "Fruits"
        if energy_kcal > 300 and fat_g > 20:
            return "Snacks & Sweets"

        return str(self.category_model.predict(features)[0])

    def find_similar_foods(self, nutrients, top_n=5):
        protein_g   = nutrients.get("protein_g", 0)
        fat_g       = nutrients.get("fat_g", 0)
        carb_g      = nutrients.get("carb_g", 0)
        energy_kcal = nutrients.get("energy_kcal", 0)
        fibre_g     = nutrients.get("fibre_g", 0)

        predicted_category = self.predict_category(nutrients)
        category_foods = self.foods_db[self.foods_db["category"] == predicted_category]
        search_df = category_foods if len(category_foods) >= top_n else self.foods_db

        similarities = []
        for _, food in search_df.iterrows():
            distance = np.sqrt(
                ((food["protein_g"] - protein_g) / 30) ** 2 * 2 +
                ((food["fat_g"]     - fat_g)     / 30) ** 2 * 1.5 +
                ((food["carb_g"]    - carb_g)    / 80) ** 2 * 1.5 +
                ((food["energy_kcal"] - energy_kcal) / 500) ** 2 +
                ((food["fibre_g"]   - fibre_g)   / 10) ** 2
            )
            similarities.append({
                "food_name": food["food_name"],
                "category":  food["category"],
                "distance":  distance,
                "nutrients": {
                    k: float(food[k]) for k in
                    ["protein_g", "fat_g", "carb_g", "fibre_g",
                     "freesugar_g", "calcium_mg", "iron_mg", "sodium_mg", "energy_kcal"]
                    if k in food
                },
            })

        similarities.sort(key=lambda x: x["distance"])
        return [{"food_name": s["food_name"], "category": s["category"],
                 "nutrients": s["nutrients"]} for s in similarities[:top_n]]

    def search_foods(self, query, limit=20):
        mask = self.foods_db["food_name"].str.lower().str.contains(query.lower(), na=False)
        return self.foods_db[mask].head(limit).to_dict("records")

    def get_food_by_name(self, food_name):
        result = self.foods_db[self.foods_db["food_name"].str.lower() == food_name.lower()]
        if len(result) == 0:
            result = self.foods_db[self.foods_db["food_name"].str.lower().str.contains(food_name.lower(), na=False)]
        return result.iloc[0].to_dict() if len(result) > 0 else None

    def get_category_foods(self, category, limit=50):
        mask = self.foods_db["category"].str.lower() == category.lower()
        return self.foods_db[mask].head(limit).to_dict("records")

    def analyze_complete(self, food_name, nutrients):
        if "energy_kcal" not in nutrients:
            nutrients["energy_kcal"] = self.predict_calories(nutrients)
        health_labels = self.predict_health_labels(nutrients)
        category      = self.predict_category(nutrients)
        similar_foods = self.find_similar_foods(nutrients)
        insights      = self._generate_insights(nutrients, health_labels)
        return {
            "food_name":         food_name,
            "predicted_calories": round(nutrients["energy_kcal"], 2),
            "category":          category,
            "health_labels":     health_labels,
            "similar_foods":     similar_foods,
            "insights":          insights,
            "region":            "indian",
            "model_version":     "1.0",
            "source":            "Anuvaad_INDB_2024.11",
        }

    def _generate_insights(self, nutrients, health_labels):
        insights = []
        if health_labels.get("high_protein"):
            insights.append("Excellent protein source for muscle building")
        if health_labels.get("high_fiber"):
            insights.append("High fiber content supports digestive health")
        if health_labels.get("low_calorie"):
            insights.append("Low calorie option suitable for weight management")
        if health_labels.get("high_sugar"):
            insights.append("High sugar content - consume in moderation")
        total_macro = nutrients.get("protein_g", 0) + nutrients.get("fat_g", 0) + nutrients.get("carb_g", 0)
        if total_macro > 0 and (nutrients.get("protein_g", 0) / total_macro) * 100 > 30:
            insights.append("High protein ratio - great for satiety")
        if nutrients.get("calcium_mg", 0) > 100:
            insights.append("Good source of calcium for bone health")
        if nutrients.get("iron_mg", 0) > 3:
            insights.append("Rich in iron - helps prevent anemia")
        return insights


_analyzer = None

def get_analyzer():
    global _analyzer
    if _analyzer is None:
        _analyzer = IndianFoodAnalyzer()
    return _analyzer
