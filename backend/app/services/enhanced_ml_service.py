"""
Enhanced ML Service for NutriSight AI
Integrates nutrition prediction with existing analysis
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from nutrition_predictor import NutritionPredictor, NutritionInput

class EnhancedMLService:
    def __init__(self):
        self.predictor = NutritionPredictor()
        self.loaded = False
        
    def load_model(self):
        """Load nutrition prediction model"""
        if not self.loaded:
            self.loaded = self.predictor.load_model()
        return self.loaded
    
    def analyze_nutrition(self, nutrition_data: dict) -> dict:
        """
        Analyze nutrition data and return category with insights
        
        Args:
            nutrition_data: Dict with nutrition values (energy_kcal, protein_g, etc.)
            
        Returns:
            Dict with category, confidence, and insights
        """
        if not self.loaded:
            self.load_model()
        
        try:
            # Create validated input
            nutrition_input = NutritionInput(**nutrition_data)
            
            # Get prediction
            result = self.predictor.predict(nutrition_input)
            
            # Add insights based on category
            insights = self._generate_insights(result, nutrition_data)
            result['insights'] = insights
            
            return result
            
        except Exception as e:
            print(f"Error in nutrition analysis: {e}")
            return {
                'category': 'unknown',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def _generate_insights(self, prediction: dict, nutrition_data: dict) -> list:
        """Generate actionable insights based on prediction"""
        insights = []
        category = prediction['category']
        profile = prediction['nutrition_profile']
        
        # Category-specific insights
        if category == 'lean_protein':
            insights.append("✅ Excellent protein source with low fat content")
            insights.append("💪 Great for muscle building and recovery")
            
        elif category == 'protein_rich':
            insights.append("💪 High protein content")
            if nutrition_data.get('saturated_fat_g', 0) > 5:
                insights.append("⚠️ Contains significant saturated fat - consume in moderation")
                
        elif category == 'healthy_fats':
            insights.append("🥑 Rich in healthy fats")
            insights.append("❤️ Beneficial for heart health")
            
        elif category == 'high_fat_saturated':
            insights.append("⚠️ High in saturated fats")
            insights.append("💡 Consider limiting portion sizes")
            
        elif category == 'complex_carbs':
            insights.append("🌾 Good source of complex carbohydrates")
            insights.append("⚡ Provides sustained energy")
            
        elif category == 'high_sugar':
            insights.append("⚠️ High sugar content")
            insights.append("💡 Best consumed in moderation")
            
        elif category == 'low_calorie':
            insights.append("✅ Low calorie option")
            insights.append("🥗 Great for weight management")
            
        elif category == 'balanced':
            insights.append("✅ Well-balanced nutritional profile")
            insights.append("🎯 Good all-around choice")
        
        # Nutrient density insight
        if profile['nutrient_density'] > 0.5:
            insights.append("⭐ High nutrient density - nutrient-rich food")
        
        # Fiber insight
        if nutrition_data.get('fiber_g', 0) > 5:
            insights.append("🌾 High fiber content - supports digestive health")
        
        return insights
    
    def batch_analyze(self, nutrition_data_list: list) -> list:
        """Analyze multiple nutrition profiles"""
        return [self.analyze_nutrition(data) for data in nutrition_data_list]
    
    def get_health_score(self, nutrition_data: dict) -> dict:
        """
        Calculate comprehensive health score (0-100)
        """
        result = self.analyze_nutrition(nutrition_data)
        
        # Base score from nutrient density
        base_score = min(result['nutrition_profile']['nutrient_density'] * 100, 50)
        
        # Bonus points
        bonus = 0
        
        # Protein bonus
        if result['nutrition_profile']['protein_ratio'] > 0.03:
            bonus += 10
        
        # Fiber bonus
        if nutrition_data.get('fiber_g', 0) > 3:
            bonus += 10
        
        # Low sugar bonus
        if nutrition_data.get('sugars_g', 0) < 5:
            bonus += 10
        
        # Low saturated fat bonus
        if nutrition_data.get('saturated_fat_g', 0) < 3:
            bonus += 10
        
        # Penalties
        penalty = 0
        
        # High sugar penalty
        if nutrition_data.get('sugars_g', 0) > 20:
            penalty += 15
        
        # High saturated fat penalty
        if nutrition_data.get('saturated_fat_g', 0) > 10:
            penalty += 15
        
        # High sodium penalty
        if nutrition_data.get('sodium_mg', 0) > 500:
            penalty += 10
        
        # Calculate final score
        health_score = max(0, min(100, base_score + bonus - penalty))
        
        return {
            'health_score': round(health_score, 1),
            'category': result['category'],
            'confidence': result['confidence'],
            'breakdown': {
                'base_score': round(base_score, 1),
                'bonus': bonus,
                'penalty': penalty
            },
            'insights': result['insights']
        }

# Global instance
enhanced_ml_service = EnhancedMLService()

if __name__ == "__main__":
    # Test the service
    enhanced_ml_service.load_model()
    
    test_food = {
        'energy_kcal': 165,
        'protein_g': 31,
        'total_fat_g': 3.6,
        'carbohydrate_g': 0,
        'fiber_g': 0,
        'sugars_g': 0,
        'sodium_mg': 74,
        'calcium_mg': 15,
        'iron_mg': 1.2,
        'saturated_fat_g': 1.2,
        'trans_fat_g': 0,
        'cholesterol_mg': 85
    }
    
    print("\n" + "="*60)
    print("Testing Enhanced ML Service")
    print("="*60)
    
    result = enhanced_ml_service.analyze_nutrition(test_food)
    print(f"\nCategory: {result['category']}")
    print(f"Confidence: {result['confidence']:.1%}")
    print("\nInsights:")
    for insight in result['insights']:
        print(f"  {insight}")
    
    health_result = enhanced_ml_service.get_health_score(test_food)
    print(f"\nHealth Score: {health_result['health_score']}/100")
    print(f"Breakdown: Base={health_result['breakdown']['base_score']}, "
          f"Bonus={health_result['breakdown']['bonus']}, "
          f"Penalty={health_result['breakdown']['penalty']}")
