# FoodIntel AI — Backend Implementation Guide (Phase 1)

## Overview

This document describes how to build the backend for FoodIntel AI Phase 1.
The frontend is fully built and expects a **REST API** served from `VITE_API_BASE_URL`.

---

## Tech Stack (Recommended)

| Layer          | Technology              |
|----------------|-------------------------|
| Auth           | Firebase Authentication |
| Backend        | FastAPI (Python)        |
| Database       | PostgreSQL              |
| ML Models      | scikit-learn, pickle    |
| Deployment     | Docker + Railway/Render |

---

## Authentication Flow

```
User → Register → Verify OTP → Login → Get JWT Token
                                          ↓
                              Frontend stores token (localStorage)
                                          ↓
                              Every API request sends Authorization header
                                          ↓
                              Backend verifies Firebase JWT
                                          ↓
                              Access granted / denied
```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Email/Password** and **Google** sign-in methods
3. Enable **Email verification** (Settings → Templates)
4. Set the frontend URL as an authorized domain

### Backend JWT Verification

```python
from firebase_admin import auth as firebase_auth

def verify_token(token: str):
    """Verify Firebase ID token and return decoded claims."""
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## API Endpoints — Phase 1

All endpoints are `POST` unless noted. Base path: `/api/`

### Auth Endpoints

| Method | Path                    | Body                                      | Response                          | Auth Required |
|--------|-------------------------|--------------------------------------------|-----------------------------------|---------------|
| POST   | `/api/auth/register`    | `{ email, password, displayName }`        | `{ user, message }`              | No            |
| POST   | `/api/auth/login`       | `{ email, password }`                     | `{ user, tokens }`               | No            |
| POST   | `/api/auth/verify-otp`  | `{ email, otp }`                          | `{ user, tokens }`               | No            |
| POST   | `/api/auth/resend-otp`  | `{ email }`                               | `{ message }`                    | No            |
| POST   | `/api/auth/forgot-password` | `{ email }`                           | `{ message }`                    | No            |
| POST   | `/api/auth/reset-password`  | `{ token, newPassword }`              | `{ message }`                    | No            |
| POST   | `/api/auth/update-password` | `{ currentPassword, newPassword }`    | `{ message }`                    | Yes           |
| POST   | `/api/auth/update-profile`  | `{ displayName?, photoURL?, phoneNumber? }` | `{ user }`                 | Yes           |
| POST   | `/api/auth/oauth`       | `{ provider }`                            | `{ redirectUrl }`                | No            |
| POST   | `/api/auth/refresh`     | `{ refreshToken }`                        | `{ accessToken, refreshToken, expiresAt }` | No   |
| POST   | `/api/auth/logout`      | —                                         | `{ message }`                    | Yes           |
| GET    | `/api/auth/me`          | —                                         | `{ user }`                       | Yes           |

### Analysis Endpoints

| Method | Path                    | Body                          | Response                          | Auth Required |
|--------|-------------------------|-------------------------------|-----------------------------------|---------------|
| POST   | `/api/analyze`          | `{ ingredientText }`          | `AnalysisResult`                 | No (Phase 1)  |
| POST   | `/api/detect-allergens` | `{ ingredientText }`          | `{ allergens: Allergen[] }`      | No (Phase 1)  |
| POST   | `/api/calculate-score`  | `{ ingredientText }`          | `{ cleanLabelScore, healthRiskScore }` | No (Phase 1) |

---

## Type Contracts

The frontend expects these exact TypeScript types. The backend must return matching JSON.

### User

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  createdAt: string;   // ISO 8601
  lastLoginAt: string; // ISO 8601
}
```

### AuthTokens

```typescript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  allergens: Allergen[];
  category: { category: string; confidence: number } | null;
  ingredientCount: number;
  ingredients: string[];
  topIngredients: { name: string; count: number; percentage: number }[];
  cleanLabelScore: number | null;
  analyzedAt: string; // ISO 8601
}
```

### Allergen

```typescript
interface Allergen {
  name: string;
  keywords: string[];
  detected: boolean;
  matchedKeywords: string[];
  severity: 'high' | 'medium' | 'low';
}
```

---

## Environment Variables

The frontend uses:

| Variable             | Purpose                         | Example                    |
|----------------------|---------------------------------|----------------------------|
| `VITE_API_BASE_URL`  | Backend API root URL            | `https://api.foodintel.ai` |

When this is set, the frontend automatically switches from local client-side analysis to backend API calls.

---

## Error Handling

The backend should return errors as:

```json
{
  "message": "Human-readable error description"
}
```

With appropriate HTTP status codes:
- `400` — Validation error
- `401` — Unauthorized (invalid/expired token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `500` — Server error

---

## CORS Configuration

Backend must allow:
- Origin: frontend domain (or `*` in dev)
- Headers: `Content-Type`, `Authorization`
- Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

---

## Phase 1 Access Control

- **All analysis endpoints are public** (no auth required)
- Auth endpoints are available but analysis doesn't require login
- Starting Phase 2, premium features will require `Authorization: Bearer <token>`

---

## Quick Start (FastAPI)

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FoodIntel AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze(body: AnalyzeRequest):
    # Run allergen detection + scoring
    ...

@app.post("/api/auth/login")
async def login(body: LoginRequest):
    # Firebase Auth verify
    ...
```

---

## File Structure (Recommended)

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py             # Environment config
│   ├── models/               # Pydantic models
│   │   ├── auth.py
│   │   └── analysis.py
│   ├── routes/               # API route handlers
│   │   ├── auth.py
│   │   └── analysis.py
│   ├── services/             # Business logic
│   │   ├── auth_service.py
│   │   ├── allergen_engine.py
│   │   └── score_engine.py
│   ├── middleware/            # Auth middleware
│   │   └── firebase_auth.py
│   └── ml/                   # ML model loading
│       └── category_model.pkl
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```
