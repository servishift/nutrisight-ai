"""
Train ML Model Script
Run this to train the ingredient classification model
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ml_trainer import train_and_save_model

if __name__ == '__main__':
    print("=" * 70)
    print("NutriSight AI - Training Ingredient Classification Model")
    print("=" * 70)
    print()
    
    # Configuration
    MODEL_TYPE = 'logistic'  # Options: 'logistic', 'naive_bayes', 'random_forest'
    SAMPLE_SIZE = None       # Use ALL 12,321 samples for better accuracy
    
    print(f"Configuration:")
    print(f"  Model Type: {MODEL_TYPE}")
    print(f"  Sample Size: {SAMPLE_SIZE if SAMPLE_SIZE else 'All data'}")
    print()
    
    try:
        # Train model
        classifier, accuracy = train_and_save_model(
            model_type=MODEL_TYPE,
            sample_size=SAMPLE_SIZE
        )
        
        print()
        print("=" * 70)
        print(f"Training Complete! Accuracy: {accuracy:.2%}")
        print("=" * 70)
        print()
        print("Model files saved in 'models/' directory:")
        print("  - vectorizer.pkl")
        print("  - classifier.pkl")
        print("  - categories.pkl")
        print()
        print("You can now use the trained model in your API!")
        
    except Exception as e:
        print()
        print("=" * 70)
        print(f"Training Failed: {e}")
        print("=" * 70)
        import traceback
        traceback.print_exc()
