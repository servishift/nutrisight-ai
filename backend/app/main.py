from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.firebase_init import init_firebase
from app.routes.auth_routes import auth_bp
from app.routes.analysis_routes import analysis_bp
from app.routes.additive_routes import additive_bp
from app.routes.frequency_routes import frequency_bp
from app.routes.explainability_routes import explainability_bp
from app.routes.graph_routes import graph_bp
from app.routes.batch_routes import batch_bp
from app.routes.admin_routes import admin_bp
from app.routes.phase3_routes import phase3_bp
from app.routes.phase4_routes import phase4_bp
from app.routes.nutrition_routes import nutrition_bp
from app.routes.ingredient_search_routes import ingredient_search_bp
from app.routes.indian_routes import indian_bp
from app.routes.webhook_routes import webhook_bp
from app.routes.admin_webhook_routes import admin_webhook_bp
from app.routes.payment_routes import payment_bp
from app.routes.admin_subscription_routes import admin_subscription_bp
from app.routes.api_routes import api_bp
from app.routes.api_pricing_routes import api_pricing_bp
from app.routes.admin_api_subscription_routes import admin_api_bp
from app.routes.admin_pricing_routes import admin_pricing_bp
from app.routes.diet_routes import diet_bp
from app.routes.security_routes import security_bp
import os

def create_app():
    """Create and configure Flask app"""
    app = Flask(__name__)
    
    # Production logging (only in production)
    if not app.debug and os.getenv('FLASK_ENV') == 'production':
        try:
            from app.utils.logging_config import setup_logging
            setup_logging(app)
        except ImportError:
            pass
    
    # CORS configuration — restrict to known frontend origins
    allowed_origins = [
        o.strip() for o in
        os.getenv('ALLOWED_ORIGINS', 'http://localhost:8080,http://localhost:3000').split(',')
        if o.strip()
    ]
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False
        }
    })
    
    # Initialize Firebase
    try:
        init_firebase()
        print("Firebase initialized")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(additive_bp)
    app.register_blueprint(frequency_bp)
    app.register_blueprint(explainability_bp)
    app.register_blueprint(graph_bp)
    app.register_blueprint(batch_bp)
    app.register_blueprint(admin_bp)  # Admin panel routes
    app.register_blueprint(phase3_bp)  # Phase 3: Similarity & Brand Prediction
    app.register_blueprint(phase4_bp)  # Phase 4: API Keys, Usage, Webhooks
    app.register_blueprint(nutrition_bp)  # Nutrition Lookup
    app.register_blueprint(ingredient_search_bp)  # Ingredient Search
    app.register_blueprint(indian_bp)  # Indian Food Database
    app.register_blueprint(webhook_bp)  # Webhooks
    app.register_blueprint(admin_webhook_bp)  # Admin Webhooks
    app.register_blueprint(payment_bp)  # Payment & Subscriptions
    app.register_blueprint(admin_subscription_bp)  # Admin Subscription Management
    app.register_blueprint(api_bp)  # Public API (API Key Auth)
    app.register_blueprint(api_pricing_bp)  # API Pricing & Subscriptions
    app.register_blueprint(admin_api_bp)  # Admin API Subscription Management
    app.register_blueprint(admin_pricing_bp)  # Admin Pricing Management
    app.register_blueprint(diet_bp, url_prefix='/api/diet')  # AI Diet Engine
    app.register_blueprint(security_bp)  # Security Control Panel
    
    # Health check
    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'service': 'FoodIntel AI API'}), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'service': 'FoodIntel AI Backend',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth/*',
                'analysis': '/api/analyze, /api/detect-allergens, /api/calculate-score',
                'additives': '/api/additives, /api/additives/stats, /api/additives/types',
                'frequency': '/api/frequency/top-ingredients, /api/frequency/category-analysis',
                'explainability': '/api/explain/prediction',
                'graph': '/api/graph/stats, /api/graph/hubs, /api/graph/communities, /api/graph/additive-network',
                'batch': '/api/batch/analyze, /api/batch/template',
                'phase3': '/api/phase3/similarity, /api/phase3/brand-prediction, /api/phase3/health',
                'phase4': '/api/phase4/keys, /api/phase4/usage, /api/phase4/webhooks, /api/phase4/playground/*',
                'nutrition': '/api/nutrition/lookup, /api/nutrition/analyze, /api/nutrition/health',
                'admin': '/api/admin/* (requires admin role)',
                'health': '/health'
            }
        }), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
