"""
ML Prediction Service
Uses trained model to predict food categories
"""
import os
from app.services.ml_trainer import IngredientClassifier

class MLPredictionService:
    def __init__(self):
        self.classifier = None
        self.vectorizer = None
        self.categories = None
        self.model_loaded = False
        
    def load_model(self, model_dir='models'):
        """Load trained model"""
        try:
            import os
            # Get absolute path
            if not os.path.isabs(model_dir):
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                model_dir = os.path.join(base_dir, model_dir)
            
            model_path = os.path.join(model_dir, 'classifier.pkl')
            print(f"Looking for model at: {model_path}")
            
            if not os.path.exists(model_path):
                print(f"ML model not found at {model_path}")
                return False
            
            self.classifier = IngredientClassifier()
            self.classifier.load_model(model_dir)
            self.vectorizer = self.classifier.vectorizer
            self.categories = self.classifier.categories
            self.model_loaded = True
            print("ML model loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading ML model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def predict_category(self, ingredient_text):
        """Predict food category from ingredients"""
        if not self.model_loaded:
            print("Model not loaded, attempting to load...")
            if not self.load_model():
                print("Failed to load model")
                return None
        
        try:
            result = self.classifier.predict(ingredient_text)
            print(f"Prediction successful: {result['predicted_category']}")
            return result
        except Exception as e:
            print(f"Prediction error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def is_available(self):
        """Check if ML model is available"""
        return self.model_loaded or os.path.exists('models/classifier.pkl')

# Global instance
ml_service = MLPredictionService()
