"""
Explainability Service (Lightweight)
Provides model interpretability using feature coefficients
"""
import numpy as np
from app.services.ml_service import ml_service

class ExplainabilityService:
    def __init__(self):
        self._initialized = False
    
    def initialize(self):
        """Initialize explainer"""
        if self._initialized:
            return True
        
        try:
            if not ml_service.model_loaded:
                ml_service.load_model()
            
            if not ml_service.model_loaded:
                return False
                
            self._initialized = True
            print("Explainability service initialized")
            return True
        except Exception as e:
            print(f"Failed to initialize explainer: {e}")
            return False
    
    def explain_prediction(self, ingredient_text, top_n=10):
        """
        Explain prediction using feature importance
        Returns top contributing ingredients
        """
        if not self._initialized:
            if not self.initialize():
                return None
        
        try:
            # Get prediction
            prediction = ml_service.predict_category(ingredient_text)
            if not prediction:
                return None
            
            predicted_class = prediction['predicted_category']
            predicted_idx = list(ml_service.categories).index(predicted_class)
            
            # Transform input
            X = ml_service.vectorizer.transform([ingredient_text])
            
            # Get feature names and values
            feature_names = ml_service.vectorizer.get_feature_names_out()
            feature_values = X.toarray()[0]
            
            # Get model coefficients for predicted class
            if hasattr(ml_service.classifier, 'coef_'):
                coefficients = ml_service.classifier.coef_[predicted_idx]
            elif hasattr(ml_service.classifier.model, 'coef_'):
                coefficients = ml_service.classifier.model.coef_[predicted_idx]
            else:
                # For models without coef_, use feature importances
                coefficients = np.ones(len(feature_names))
            
            # Calculate feature contributions
            contributions = feature_values * coefficients
            
            # Get top contributing features
            top_indices = np.argsort(np.abs(contributions))[-top_n:][::-1]
            
            result_contributions = []
            for idx in top_indices:
                if contributions[idx] != 0:
                    result_contributions.append({
                        'feature': feature_names[idx],
                        'shapValue': float(contributions[idx]),
                        'impact': 'positive' if contributions[idx] > 0 else 'negative',
                        'importance': float(abs(contributions[idx]))
                    })
            
            return {
                'predictedCategory': predicted_class,
                'confidence': prediction['confidence'],
                'topContributions': result_contributions,
                'baseValue': 0.0
            }
        except Exception as e:
            print(f"Error explaining prediction: {e}")
            return None

# Singleton instance
explainability_service = ExplainabilityService()
