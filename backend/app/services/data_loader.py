"""
Data Loader Service
Loads food ingredient data from Neon DB (falls back to CSV if DB unavailable).
"""
import os
import pandas as pd
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
        print(f"[DataLoader] DB engine error: {e}")
        return None


@lru_cache(maxsize=1)
def _load_from_neon():
    engine = _get_engine()
    if engine is None:
        return None
    try:
        df = pd.read_sql_table("food_ingredients", engine)
        print(f"[DataLoader] Loaded {len(df):,} rows from Neon: food_ingredients")
        return df
    except Exception as e:
        print(f"[DataLoader] Neon read failed: {e}")
        return None


def _load_from_csv():
    base = Path(__file__).parent.parent.parent
    primary  = base / "dataset" / "Food_Ingredient_Intelligence_Database.csv"
    fallback = base / "models"  / "nutrition_database.csv"
    path = primary if primary.exists() else fallback
    print(f"[DataLoader] CSV fallback: {path.name}")
    return pd.read_csv(path, low_memory=False)


class FDCDataLoader:
    def __init__(self, dataset_path=None):
        self.dataset_path = dataset_path  # kept for compat; ignored when Neon is available
        self.df = None

    def load_data(self):
        if self.df is not None:
            return self.df

        df = _load_from_neon()
        if df is None:
            df = _load_from_csv()

        # Normalise columns
        if "ingredients" not in df.columns:
            df["ingredients"] = df.get("description", "")
        if "food_category" not in df.columns:
            df["food_category"] = df.get("category_name", "Unknown")
        if "fdc_id" not in df.columns:
            df["fdc_id"] = df.index
        if "brand_name" not in df.columns:
            df["brand_name"] = ""
        if "search_category" not in df.columns:
            df["search_category"] = df["food_category"]
        if "brand_owner" not in df.columns:
            df["brand_owner"] = ""
        if "description" not in df.columns:
            df["description"] = df.get("ingredients", "")

        self.df = df
        return self.df

    def get_training_data(self, sample_size=None):
        if self.df is None:
            self.load_data()
        df_clean = self.df[self.df["ingredients"].notna()].copy()
        if sample_size:
            df_clean = df_clean.sample(n=min(sample_size, len(df_clean)), random_state=42)
        return df_clean[["fdc_id", "description", "brand_owner", "brand_name",
                          "ingredients", "food_category", "search_category"]].to_dict("records")

    def get_ingredient_samples(self, limit=100):
        if self.df is None:
            self.load_data()
        samples = self.df[self.df["ingredients"].notna()].sample(n=min(limit, len(self.df)))
        return samples[["description", "ingredients", "food_category"]].to_dict("records")

    def get_categories(self):
        if self.df is None:
            self.load_data()
        return self.df["food_category"].unique().tolist()

    def search_by_ingredient(self, ingredient_keyword):
        if self.df is None:
            self.load_data()
        mask = self.df["ingredients"].str.contains(ingredient_keyword, case=False, na=False)
        return self.df[mask][["description", "ingredients", "food_category"]].head(10).to_dict("records")


# Global instance
fdc_loader = FDCDataLoader()
