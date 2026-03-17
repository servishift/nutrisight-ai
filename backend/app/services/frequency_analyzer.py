"""
Ingredient Frequency Analysis Service
"""
from collections import Counter
import re
import pandas as pd
from app.services.data_loader import FDCDataLoader

class FrequencyAnalyzer:
    def __init__(self):
        self.data_loader = None
        self._ingredient_cache = None
        self._category_cache = None
        self._df_cache = None

    def _ensure_data(self):
        if self._df_cache is not None:
            return self._df_cache
        if self.data_loader is None:
            self.data_loader = FDCDataLoader()
        df = self.data_loader.load_data()
        # Drop rows with no ingredient text
        df = df[df['ingredients'].notna()].copy()
        df['ingredients'] = df['ingredients'].astype(str)
        self._df_cache = df
        return df

    def _parse_ingredient(self, text):
        if not text or text == 'nan':
            return []
        parts = re.split(r'[,;]+', text)
        result = []
        for p in parts:
            clean = re.sub(r'[()\[\]]', '', p.strip()).strip().upper()
            if clean and len(clean) > 1:
                result.append(clean)
        return result

    def clear_cache(self):
        self._ingredient_cache = None
        self._category_cache = None
        self._df_cache = None

    def get_top_ingredients(self, top_n=50):
        if self._ingredient_cache:
            return self._ingredient_cache[:top_n]

        df = self._ensure_data()

        # Parse all ingredients at once
        all_parsed = df['ingredients'].apply(self._parse_ingredient)
        all_ingredients = [ing for sublist in all_parsed for ing in sublist]
        counter = Counter(all_ingredients)
        total = max(len(all_ingredients), 1)

        # Build a set of top ingredients for fast product-count lookup
        top_items = counter.most_common(100)
        top_set = {ing for ing, _ in top_items}

        # Vectorized product count: for each top ingredient, count rows containing it
        ing_upper = df['ingredients'].str.upper()
        product_counts = {
            ing: int(ing_upper.str.contains(re.escape(ing), regex=True, na=False).sum())
            for ing in top_set
        }

        result = [
            {
                'ingredient': ing,
                'count': cnt,
                'percentage': round((cnt / total) * 100, 2),
                'products': product_counts.get(ing, 0),
            }
            for ing, cnt in top_items
        ]

        self._ingredient_cache = result
        return result[:top_n]

    def get_category_frequency(self):
        if self._category_cache:
            return self._category_cache

        df = self._ensure_data()

        # Fill missing categories
        df['food_category'] = df['food_category'].fillna('Unknown').replace('nan', 'Unknown')

        # Parse ingredients per row using vectorized apply
        df['_parsed'] = df['ingredients'].apply(self._parse_ingredient)

        category_data = {}
        for cat, group in df.groupby('food_category'):
            all_ings = [ing for sublist in group['_parsed'] for ing in sublist]
            counter = Counter(all_ings)
            product_count = len(group)
            ingredient_count = len(all_ings)
            top_5 = [{'ingredient': i, 'count': c} for i, c in counter.most_common(5)]
            category_data[cat] = {
                'category': cat,
                'productCount': product_count,
                'ingredientCount': ingredient_count,
                'avgIngredientsPerProduct': round(ingredient_count / product_count, 2) if product_count else 0,
                'topIngredients': top_5,
            }

        result = sorted(category_data.values(), key=lambda x: x['productCount'], reverse=True)
        self._category_cache = result
        return result

# Singleton instance
frequency_analyzer = FrequencyAnalyzer()
