"""
Neon DB connection utility.
All services use load_table() to get data as a DataFrame.
Falls back to CSV if DATABASE_URL is not configured (local dev without Neon).
"""

import os
import pandas as pd
from functools import lru_cache
from pathlib import Path

_engine = None

def get_engine():
    global _engine
    if _engine is not None:
        return _engine
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    try:
        from sqlalchemy import create_engine
        _engine = create_engine(url, connect_args={"sslmode": "require"}, pool_pre_ping=True)
        return _engine
    except Exception as e:
        print(f"[DB] Could not connect to Neon DB: {e}")
        return None


# Map table name → fallback CSV path (relative to backend/)
_FALLBACK = {
    "food_ingredients":       "dataset/Food_Ingredient_Intelligence_Database.csv",
    "indian_foods":           "indian_data/indian_foods_master.csv",
    "indian_foods_clustered": "indian_data/clustered_foods.csv",
    "nutrition_database":     "models/nutrition_database.csv",
    "diet_recommendations":   "diet_recommendation_dataset/diet_recommendation_dataset.csv",
    "disease_diet_rules":     "diet_recommendation_dataset/disease_diet_rules.csv",
    "disease_nutrition_rules":"diet_recommendation_dataset/disease_nutrition_rules.csv",
    "meal_plans":             "diet_recommendation_dataset/meal_planning_dataset.csv",
    "oxalate_data":           "diet_recommendation_dataset/oxalate_dataset.csv",
}

_BASE = Path(__file__).parent.parent.parent  # backend/


@lru_cache(maxsize=16)
def load_table(table_name: str) -> pd.DataFrame:
    """Load a table from Neon DB, falling back to local CSV."""
    engine = get_engine()
    if engine:
        try:
            df = pd.read_sql_table(table_name, engine)
            print(f"[DB] Loaded {len(df)} rows from Neon: {table_name}")
            return df
        except Exception as e:
            print(f"[DB] Neon read failed for {table_name}: {e} — falling back to CSV")

    # Fallback to CSV
    csv_rel = _FALLBACK.get(table_name)
    if csv_rel:
        csv_path = _BASE / csv_rel
        if csv_path.exists():
            df = pd.read_csv(csv_path, low_memory=False)
            print(f"[DB] Loaded {len(df)} rows from CSV fallback: {csv_path.name}")
            return df

    print(f"[DB] WARNING: No data source found for table '{table_name}'")
    return pd.DataFrame()


def clear_cache():
    load_table.cache_clear()
