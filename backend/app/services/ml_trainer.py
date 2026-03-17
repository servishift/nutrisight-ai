"""
ML Model Training Script
Trains ingredient classification model using real FDC data
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
from app.services.data_loader import fdc_loader

class IngredientClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        self.model = None
        self.categories = []
        
    def prepare_data(self, sample_size=10000):
        """Prepare training data from FDC dataset"""
        print("Loading FDC dataset...")
        training_data = fdc_loader.get_training_data(sample_size=sample_size)
        
        if not training_data:
            raise Exception("No training data available")
        
        # Create DataFrame
        df = pd.DataFrame(training_data)
        
        # Filter categories with sufficient samples
        category_counts = df['food_category'].value_counts()
        valid_categories = category_counts[category_counts >= 10].index
        df = df[df['food_category'].isin(valid_categories)]
        
        print(f"\nPrepared {len(df)} samples across {len(valid_categories)} categories")
        
        return df
    
    def train(self, model_type='logistic', sample_size=10000):
        """Train the classification model"""
        # Prepare data
        df = self.prepare_data(sample_size)
        
        X = df['ingredients']
        y = df['food_category']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Vectorize
        print("Vectorizing ingredients...")
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        # Train model
        print(f"Training {model_type} model...")
        if model_type == 'naive_bayes':
            self.model = MultinomialNB()
        elif model_type == 'random_forest':
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        else:  # logistic regression (default)
            self.model = LogisticRegression(max_iter=1000, random_state=42)
        
        self.model.fit(X_train_vec, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\nModel trained successfully!")
        print(f"Accuracy: {accuracy:.2%}")
        
        # Store categories
        self.categories = self.model.classes_.tolist()
        
        return accuracy
    
    def predict(self, ingredient_text):
        """Predict food category from ingredients"""
        if not self.model:
            raise Exception("Model not trained. Call train() first.")
        
        # Vectorize
        X_vec = self.vectorizer.transform([ingredient_text])
        
        # Predict
        category = self.model.predict(X_vec)[0]
        probabilities = self.model.predict_proba(X_vec)[0]
        
        # Get top 3 predictions
        top_indices = np.argsort(probabilities)[-3:][::-1]
        predictions = []
        for idx in top_indices:
            predictions.append({
                'category': self.categories[idx],
                'confidence': float(probabilities[idx])
            })
        
        return {
            'predicted_category': category,
            'confidence': float(max(probabilities)),
            'top_predictions': predictions
        }
    
    def save_model(self, model_dir='models'):
        """Save trained model"""
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.vectorizer, f'{model_dir}/vectorizer.pkl')
        joblib.dump(self.model, f'{model_dir}/classifier.pkl')
        joblib.dump(self.categories, f'{model_dir}/categories.pkl')
        
        print(f"Model saved to {model_dir}/")
    
    def load_model(self, model_dir='models'):
        """Load trained model"""
        self.vectorizer = joblib.load(f'{model_dir}/vectorizer.pkl')
        self.model = joblib.load(f'{model_dir}/classifier.pkl')
        self.categories = joblib.load(f'{model_dir}/categories.pkl')
        
        print(f"Model loaded from {model_dir}/")

def train_and_save_model(model_type='logistic', sample_size=10000):
    """Train and save model"""
    classifier = IngredientClassifier()
    accuracy = classifier.train(model_type=model_type, sample_size=sample_size)
    classifier.save_model()
    return classifier, accuracy

if __name__ == '__main__':
    print("=" * 60)
    print("NutriSight AI - ML Model Training")
    print("=" * 60)
    
    # Train model
    classifier, accuracy = train_and_save_model(
        model_type='logistic',
        sample_size=10000
    )
    
    # Test prediction
    print("\n" + "=" * 60)
    print("Testing Model")
    print("=" * 60)
    
    test_ingredients = "ENRICHED WHEAT FLOUR, WATER, SUGAR, YEAST, SALT"
    result = classifier.predict(test_ingredients)
    
    print(f"\nTest Ingredients: {test_ingredients}")
    print(f"Predicted Category: {result['predicted_category']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print("\nTop 3 Predictions:")
    for pred in result['top_predictions']:
        print(f"  - {pred['category']}: {pred['confidence']:.2%}")
