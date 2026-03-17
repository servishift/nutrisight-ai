from app.main import create_app
from app.services.ml_service import ml_service
import os

app = create_app()

# Auto-load ML models on startup
if os.path.exists('models/classifier.pkl'):
    print("Loading ML model...")
    ml_service.load_model()
else:
    print("ML model not found. Train with: python train_model.py")

# Load nutrition lookup models
if os.path.exists('models/ingredient_vectorizer.pkl'):
    print("Loading nutrition lookup models...")
    try:
        from app.routes.nutrition_routes import load_models
        load_models()
    except Exception as e:
        print(f"[WARNING] Nutrition models not loaded: {e}")
else:
    print("[WARNING] Nutrition models not found. Train with: python ml/run_nutrition_pipeline.py")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
