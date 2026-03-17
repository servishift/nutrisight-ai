import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Firebase
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')
    FIREBASE_PRIVATE_KEY_ID = os.getenv('FIREBASE_PRIVATE_KEY_ID')
    FIREBASE_PRIVATE_KEY = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
    FIREBASE_CLIENT_EMAIL = os.getenv('FIREBASE_CLIENT_EMAIL')
    FIREBASE_CLIENT_ID = os.getenv('FIREBASE_CLIENT_ID')
    FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY')  # For password verification
    
    # Email
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_EMAIL = os.getenv('SMTP_EMAIL')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    
    # JWT — must be set via environment variable in production
    JWT_SECRET = os.getenv('JWT_SECRET')
    if not JWT_SECRET:
        import sys
        if os.getenv('FLASK_ENV') == 'production':
            print('FATAL: JWT_SECRET environment variable is not set', file=sys.stderr)
            sys.exit(1)
        JWT_SECRET = 'dev-only-insecure-secret-do-not-use-in-prod'
    JWT_EXPIRY_HOURS = 24
    
    # OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    
    # App
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')
    
    # Razorpay
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

    # Neon PostgreSQL
    DATABASE_URL = os.getenv('DATABASE_URL')
