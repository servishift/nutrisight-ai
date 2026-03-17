"""
Ingredient-to-Nutrition ML Model Trainer
Trains model to match ingredient text to nutrition data
"""
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os
import json
from datetime import datetime

class IngredientNutritionModel:
    def __init__(self, data_path="../dataset/processed"):
        self.data_path = data_path
        self.vectorizer = None
        self.food_vectors = None
        self.nutrition_db = None
        
    def load_training_data(self):
        """Load processed training data"""
        print("="*70)
        print("  Loading Training Data")
        print("="*70)
        
        # Find latest training data
        files = [f for f in os.listdir(self.data_path) if f.startswith('nutrition_training_data')]
        if not files:
            raise Exception(f"No training data found in {self.data_path}/. Run process_nutrition_data.py first.")
        
        latest_file = sorted(files)[-1]
        file_path = os.path.join(self.data_path, latest_file)
        
        print(f"\nLoading: {file_path}")
        self.nutrition_db = pd.read_csv(file_path)
        print(f"✓ Loaded {len(self.nutrition_db):,} foods")
        
        return self.nutrition_db
    
    def train_search_index(self):
        """Train TF-IDF search index"""
        print("\n" + "="*70)
        print("  Training Search Index")
        print("="*70)
        
        print("\n[1/3] Preparing search text...")
        # Combine description + ingredients + category for better matching
        search_texts = []
        for idx, row in self.nutrition_db.iterrows():
            text_parts = [str(row['description']).lower()]
            
            if pd.notna(row.get('ingredients')):
                text_parts.append(str(row['ingredients']).lower())
            
            if pd.notna(row.get('category_name')):
                text_parts.append(str(row['category_name']).lower())
            
            if pd.notna(row.get('branded_food_category')):
                text_parts.append(str(row['branded_food_category']).lower())
            
            search_texts.append(' '.join(text_parts))
        
        print(f"  ✓ Prepared {len(search_texts):,} search texts")
        
        print("\n[2/3] Training TF-IDF vectorizer...")
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 3),
            stop_words='english',
            min_df=2,
            max_df=0.8
        )
        
        self.food_vectors = self.vectorizer.fit_transform(search_texts)
        print(f"  ✓ Created {self.food_vectors.shape[0]:,} × {self.food_vectors.shape[1]:,} matrix")
        
        print("\n[3/3] Calculating vocabulary size...")
        vocab_size = len(self.vectorizer.vocabulary_)
        print(f"  ✓ Vocabulary: {vocab_size:,} terms")
        
    def test_model(self):
        """Test model with sample queries"""
        print("\n" + "="*70)
        print("  Testing Model")
        print("="*70)
        
        test_queries = [
            "chicken breast",
            "brown rice",
            "olive oil",
            "broccoli",
            "whole wheat bread",
            "salmon",
            "greek yogurt",
            "almonds"
        ]
        
        print("\nTesting ingredient matching:\n")
        
        for query in test_queries:
            matches = self.find_nutrition(query, top_n=3)
            
            print(f"Query: '{query}'")
            if matches:
                for i, match in enumerate(matches, 1):
                    print(f"  {i}. {match['name'][:60]} (confidence: {match['confidence']:.1%})")
                    print(f"     Calories: {match['nutrition']['energy_kcal']:.0f} kcal, "
                          f"Protein: {match['nutrition']['protein_g']:.1f}g")
            else:
                print("  No matches found")
            print()
    
    def find_nutrition(self, ingredient_text, top_n=5):
        """Find nutrition data for ingredient"""
        # Clean and vectorize query
        query_vector = self.vectorizer.transform([ingredient_text.lower()])
        
        # Calculate similarity
        similarities = cosine_similarity(query_vector, self.food_vectors)[0]
        
        # Get top matches
        top_indices = np.argsort(similarities)[-top_n:][::-1]
        
        matches = []
        for idx in top_indices:
            if similarities[idx] > 0.05:  # Minimum threshold
                food = self.nutrition_db.iloc[idx]
                matches.append({
                    'name': food['description'],
                    'confidence': float(similarities[idx]),
                    'nutrition': {
                        'energy_kcal': float(food.get('energy_kcal', 0)),
                        'protein_g': float(food.get('protein_g', 0)),
                        'total_fat_g': float(food.get('total_fat_g', 0)),
                        'carbohydrate_g': float(food.get('carbohydrate_g', 0)),
                        'fiber_g': float(food.get('fiber_g', 0)),
                        'sugars_g': float(food.get('sugars_g', 0)),
                        'sodium_mg': float(food.get('sodium_mg', 0)),
                        'calcium_mg': float(food.get('calcium_mg', 0)),
                        'iron_mg': float(food.get('iron_mg', 0)),
                        'saturated_fat_g': float(food.get('saturated_fat_g', 0)),
                        'cholesterol_mg': float(food.get('cholesterol_mg', 0)),
                        'vitamin_a_ug': float(food.get('vitamin_a_ug', 0)),
                        'vitamin_c_mg': float(food.get('vitamin_c_mg', 0))
                    },
                    'category': food.get('category_name', 'Unknown'),
                    'brand': food.get('brand_owner', None)
                })
        
        return matches
    
    def save_model(self):
        """Save trained model"""
        print("\n" + "="*70)
        print("  Saving Model")
        print("="*70)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_dir = "../models"
        os.makedirs(model_dir, exist_ok=True)
        
        # Save vectorizer
        vectorizer_path = f"{model_dir}/ingredient_vectorizer_{timestamp}.pkl"
        joblib.dump(self.vectorizer, vectorizer_path)
        print(f"\n✓ Vectorizer saved: {vectorizer_path}")
        
        # Save food vectors
        vectors_path = f"{model_dir}/food_vectors_{timestamp}.pkl"
        joblib.dump(self.food_vectors, vectors_path)
        print(f"✓ Food vectors saved: {vectors_path}")
        
        # Save nutrition database (lightweight version)
        db_cols = ['description', 'energy_kcal', 'protein_g', 'total_fat_g', 
                   'carbohydrate_g', 'fiber_g', 'sugars_g', 'sodium_mg',
                   'calcium_mg', 'iron_mg', 'saturated_fat_g', 'cholesterol_mg',
                   'vitamin_a_ug', 'vitamin_c_mg', 'category_name', 'brand_owner']
        
        available_cols = [col for col in db_cols if col in self.nutrition_db.columns]
        nutrition_db_light = self.nutrition_db[available_cols].copy()
        
        db_path = f"{model_dir}/nutrition_database_{timestamp}.csv"
        nutrition_db_light.to_csv(db_path, index=False)
        print(f"✓ Nutrition database saved: {db_path}")
        
        # Save metadata
        metadata = {
            'timestamp': timestamp,
            'total_foods': len(self.nutrition_db),
            'vocabulary_size': len(self.vectorizer.vocabulary_),
            'vector_dimensions': self.food_vectors.shape[1],
            'model_files': {
                'vectorizer': vectorizer_path,
                'food_vectors': vectors_path,
                'nutrition_database': db_path
            },
            'note': 'Models trained for ingredient-to-nutrition lookup. User analysis data is NOT saved.'
        }
        
        metadata_path = f"{model_dir}/model_metadata_{timestamp}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✓ Metadata saved: {metadata_path}")
        
        # Copy to production
        prod_vectorizer = f"{model_dir}/ingredient_vectorizer.pkl"
        prod_vectors = f"{model_dir}/food_vectors.pkl"
        prod_db = f"{model_dir}/nutrition_database.csv"
        
        joblib.dump(self.vectorizer, prod_vectorizer)
        joblib.dump(self.food_vectors, prod_vectors)
        nutrition_db_light.to_csv(prod_db, index=False)
        
        print(f"\n✓ Production models updated:")
        print(f"  • {prod_vectorizer}")
        print(f"  • {prod_vectors}")
        print(f"  • {prod_db}")
        
        return model_dir
    
    def train_pipeline(self):
        """Execute full training pipeline"""
        print("\n" + "="*70)
        print("  INGREDIENT-TO-NUTRITION MODEL TRAINING")
        print("="*70)
        
        start_time = datetime.now()
        
        # Load data
        self.load_training_data()
        
        # Train search index
        self.train_search_index()
        
        # Test model
        self.test_model()
        
        # Save model
        model_dir = self.save_model()
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        print("\n" + "="*70)
        print("  TRAINING COMPLETE!")
        print("="*70)
        print(f"\n⏱  Duration: {duration}")
        print(f"📊 Foods indexed: {len(self.nutrition_db):,}")
        print(f"📁 Model directory: {model_dir}")
        print(f"\n✅ Ready for API integration!")
        
        return model_dir

if __name__ == "__main__":
    trainer = IngredientNutritionModel(data_path="../dataset/processed")
    model_dir = trainer.train_pipeline()
