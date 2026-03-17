# FoodIntel AI Backend - Setup Guide

Complete Flask authentication backend with Firebase Admin SDK.

## 🔥 Firebase Credentials Required

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" → Enter project name → Continue
3. Disable Google Analytics (optional) → Create project

### Step 2: Enable Authentication

1. In Firebase Console → Build → Authentication → Get started
2. Enable **Email/Password** sign-in method
3. Enable **Google** sign-in method (optional for OAuth)

### Step 3: Get Service Account Credentials

1. Project Settings (gear icon) → Service accounts
2. Click "Generate new private key" → Download JSON file
3. Open the JSON file and extract these values:

```json
{
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789..."
}
```

### Step 4: Get Google OAuth Credentials (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: Web application
5. Add authorized redirect URIs: `http://localhost:8080/auth/callback`
6. Copy Client ID and Client Secret

---

## 📧 Email Configuration

### Gmail App Password Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not enabled)
3. Search "App passwords" → Select app: Mail → Select device: Other
4. Enter "FoodIntel AI" → Generate
5. Copy the 16-character password (remove spaces)

---

## 🚀 Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env` with your credentials:

```env
# Firebase (from service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password

# JWT Secret (generate random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

### 3. Run Backend

```bash
python run.py
```

Backend runs on: `http://localhost:5000`

---

## 🔗 Connect Frontend

In your frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Restart frontend dev server.

---

## 📋 API Endpoints

All endpoints are documented in `/docs/API_REFERENCE.md`

### Auth Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/update-password` - Change password (auth required)
- `POST /api/auth/update-profile` - Update profile (auth required)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (auth required)
- `GET /api/auth/me` - Get current user (auth required)
- `POST /api/auth/oauth` - OAuth login (placeholder)

### Health Check

- `GET /health` - Service health status

---

## 🧪 Testing

### Test Registration Flow

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test User"}'
```

Check your email for OTP code.

### Test OTP Verification

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # Flask app factory
│   ├── config.py               # Environment config
│   ├── firebase_init.py        # Firebase initialization
│   ├── routes/
│   │   └── auth_routes.py      # Auth endpoints
│   ├── services/
│   │   ├── auth_service.py     # Auth business logic
│   │   └── email_service.py    # OTP email sending
│   ├── middleware/
│   │   └── auth_middleware.py  # JWT verification
│   └── utils/
│       └── jwt_utils.py        # Token generation
├── run.py                      # Entry point
├── requirements.txt            # Dependencies
├── .env.example                # Environment template
└── README.md                   # This file
```

---

## ⚠️ Important Notes

### Security

- **Never commit `.env` file** - Add to `.gitignore`
- Change `JWT_SECRET` in production
- Use Redis for OTP/token storage in production (currently in-memory)
- Enable Firebase App Check for production
- Restrict CORS origins in production

### Firebase Admin SDK Limitations

- Cannot verify passwords directly (use Firebase Auth REST API in production)
- For full password verification, integrate Firebase Auth REST API:
  - Endpoint: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`
  - Requires Web API Key from Firebase Console

### Email Sending

- Gmail has daily sending limits (500 emails/day for free accounts)
- For production, use SendGrid, AWS SES, or Mailgun
- Current implementation uses in-memory OTP storage (use Redis in production)

---

## 🐛 Troubleshooting

### "Firebase initialization failed"

- Check all Firebase credentials in `.env`
- Ensure `FIREBASE_PRIVATE_KEY` has proper line breaks (`\n`)
- Verify service account has correct permissions

### "SMTP authentication failed"

- Verify Gmail App Password (not regular password)
- Check 2-Step Verification is enabled
- Ensure no spaces in app password

### "CORS error"

- Check `FRONTEND_URL` in `.env` matches your frontend
- Verify frontend is sending `Content-Type: application/json`

### "Token expired"

- Tokens expire after 24 hours (configurable in `config.py`)
- Use refresh token endpoint to get new access token

---

## 🚀 Production Deployment

### Environment Variables

Set all `.env` variables in your hosting platform:
- Railway: Settings → Variables
- Render: Environment → Environment Variables
- Heroku: Settings → Config Vars

### Recommended Changes

1. Use PostgreSQL for user data
2. Use Redis for OTP/token storage
3. Implement rate limiting (Flask-Limiter)
4. Add request logging
5. Use Gunicorn instead of Flask dev server:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

---

## 📞 Support

For issues, check:
- Firebase Console → Authentication → Users
- Backend logs: `python run.py` output
- Frontend console: Network tab for API errors
