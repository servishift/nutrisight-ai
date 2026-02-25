# FoodIntel AI — Flutter Mobile App Specification

> **Purpose**: This document is a complete specification for building the FoodIntel AI mobile app in Flutter. It mirrors the existing React web frontend, connects to the same Flask + Firebase backend, and follows a modern food-tech design system.
>
> **Target**: Hand this file to an AI coding agent (Cursor, Windsurf, etc.) to generate the full Flutter app.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [App Architecture](#4-app-architecture)
5. [Backend Integration](#5-backend-integration)
6. [Authentication Flow](#6-authentication-flow)
7. [Phase 1 — Core Analysis](#7-phase-1--core-analysis)
8. [Phase 2 — ML Features](#8-phase-2--ml-features)
9. [Phase 3 — Deep Learning / NLP](#9-phase-3--deep-learning--nlp)
10. [Phase 4 — SaaS Developer Tools](#10-phase-4--saas-developer-tools)
11. [Navigation & Layout](#11-navigation--layout)
12. [Responsive Design](#12-responsive-design)
13. [Animations & Micro-interactions](#13-animations--micro-interactions)
14. [State Management](#14-state-management)
15. [Error Handling & Loading States](#15-error-handling--loading-states)
16. [Offline Support](#16-offline-support)
17. [File Structure](#17-file-structure)
18. [Screen-by-Screen Specification](#18-screen-by-screen-specification)

---

## 1. Project Overview

**FoodIntel AI** is an ingredient intelligence platform that analyzes food product ingredients for allergens, additives, health risks, and more using ML/NLP models.

### Core Value Proposition
- Scan or paste ingredient lists → get instant health intelligence
- 12 features across 4 phases (Classical ML → Deep Learning → SaaS)
- Same backend serves both web and mobile

### Feature Summary

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Allergen Detection | 1 | Active |
| 2 | Additive Analysis | 1 | Active |
| 3 | Health Risk Score | 1 | Active |
| 4 | Category Prediction | 2 | Backend |
| 5 | Similarity Search | 3 | Active |
| 6 | Brand Prediction | 3 | Active |
| 7 | Reformulation Detection | 3 | Active |
| 8 | Embedding Explorer | 3 | Active |
| 9 | API Key Management | 4 | Active |
| 10 | API Playground | 4 | Active |
| 11 | Usage Analytics | 4 | Active |
| 12 | Webhooks | 4 | Active |

---

## 2. Tech Stack

### Flutter App
```yaml
sdk: flutter (latest stable, >=3.22)
dart: ">=3.4.0"

dependencies:
  # Core
  flutter_riverpod: ^2.5.0        # State management
  go_router: ^14.0.0              # Declarative routing
  dio: ^5.4.0                     # HTTP client
  flutter_secure_storage: ^9.2.0  # Secure token storage

  # UI
  google_fonts: ^6.2.0            # DM Sans + Playfair Display
  flutter_animate: ^4.5.0         # Animations (like framer-motion)
  fl_chart: ^0.68.0               # Charts (like recharts)
  shimmer: ^3.0.0                 # Loading skeletons
  cached_network_image: ^3.3.0    # Image caching
  flutter_svg: ^2.0.0             # SVG support

  # Auth
  firebase_core: ^2.32.0          # Firebase init
  firebase_auth: ^4.20.0          # Native Firebase auth
  google_sign_in: ^6.2.0          # Google OAuth
  sign_in_with_apple: ^6.1.0      # Apple OAuth

  # Utilities
  intl: ^0.19.0                   # Date formatting
  json_annotation: ^4.9.0         # JSON serialization
  connectivity_plus: ^6.0.0       # Network check
  share_plus: ^9.0.0              # Share results
  url_launcher: ^6.3.0            # Open links
  image_picker: ^1.1.0            # Camera for label scanning (future)
  permission_handler: ^11.3.0     # Permissions

dev_dependencies:
  build_runner: ^2.4.0
  json_serializable: ^6.8.0
  flutter_lints: ^4.0.0
  mockito: ^5.4.0
  flutter_test: sdk: flutter
```

---

## 3. Design System

### 3.1 Color Palette

The app uses a **Forest Green + Amber** food-tech palette. All colors in HSL.

```dart
// lib/core/theme/app_colors.dart

class AppColors {
  // ─── Light Theme ───
  static const background      = Color(0xFFF5F7F3);  // hsl(90, 20%, 97%)
  static const foreground       = Color(0xFF1A2E1A);  // hsl(150, 30%, 10%)
  static const card             = Color(0xFFFFFFFF);  // hsl(0, 0%, 100%)
  static const cardForeground   = Color(0xFF1A2E1A);

  static const primary          = Color(0xFF264D33);  // hsl(152, 40%, 22%)
  static const primaryForeground= Color(0xFFF5F0E6);  // hsl(60, 30%, 96%)

  static const secondary        = Color(0xFFE8ECE3);  // hsl(90, 15%, 92%)
  static const secondaryFg      = Color(0xFF213D26);  // hsl(150, 30%, 15%)

  static const muted            = Color(0xFFECEEE9);  // hsl(90, 10%, 94%)
  static const mutedForeground  = Color(0xFF6B7A6B);  // hsl(150, 10%, 45%)

  static const accent           = Color(0xFFE8A317);  // hsl(38, 85%, 55%)
  static const accentForeground = Color(0xFF2E1F08);  // hsl(30, 50%, 12%)

  static const destructive      = Color(0xFFE53E3E);  // hsl(0, 72%, 51%)
  static const success          = Color(0xFF38A169);  // hsl(152, 60%, 40%)
  static const warning          = Color(0xFFDD6B20);  // hsl(38, 92%, 50%)
  static const info             = Color(0xFF3182CE);  // hsl(200, 80%, 50%)

  static const border           = Color(0xFFDDE3D8);  // hsl(90, 15%, 88%)
  static const surfaceElevated  = Color(0xFFFFFFFF);
  static const surfaceSunken    = Color(0xFFEFF1EC);  // hsl(90, 20%, 95%)

  // ─── Dark Theme ───
  static const darkBackground       = Color(0xFF0F1A12);  // hsl(150, 20%, 6%)
  static const darkForeground       = Color(0xFFE3E8DE);  // hsl(90, 15%, 92%)
  static const darkCard             = Color(0xFF172B1D);  // hsl(150, 18%, 10%)
  static const darkPrimary          = Color(0xFF4CAF6E);  // hsl(152, 50%, 45%)
  static const darkMuted            = Color(0xFF1E2E22);  // hsl(150, 12%, 14%)
  static const darkMutedForeground  = Color(0xFF7E8E7E);  // hsl(90, 8%, 55%)
  static const darkBorder           = Color(0xFF253D2B);  // hsl(150, 12%, 18%)
  static const darkSurfaceElevated  = Color(0xFF1C3022);  // hsl(150, 16%, 12%)
}
```

### 3.2 Typography

```dart
// lib/core/theme/app_typography.dart

class AppTypography {
  // Display font — Playfair Display (headings, hero text)
  static TextStyle displayLarge = GoogleFonts.playfairDisplay(
    fontSize: 32, fontWeight: FontWeight.w800, height: 1.2,
  );
  static TextStyle displayMedium = GoogleFonts.playfairDisplay(
    fontSize: 24, fontWeight: FontWeight.w700, height: 1.3,
  );
  static TextStyle displaySmall = GoogleFonts.playfairDisplay(
    fontSize: 20, fontWeight: FontWeight.w600, height: 1.3,
  );

  // Body font — DM Sans (body, labels, UI)
  static TextStyle bodyLarge = GoogleFonts.dmSans(
    fontSize: 16, fontWeight: FontWeight.w400, height: 1.5,
  );
  static TextStyle bodyMedium = GoogleFonts.dmSans(
    fontSize: 14, fontWeight: FontWeight.w400, height: 1.5,
  );
  static TextStyle bodySmall = GoogleFonts.dmSans(
    fontSize: 12, fontWeight: FontWeight.w400, height: 1.4,
  );
  static TextStyle labelLarge = GoogleFonts.dmSans(
    fontSize: 14, fontWeight: FontWeight.w600,
  );
  static TextStyle labelSmall = GoogleFonts.dmSans(
    fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5,
  );
}
```

### 3.3 Spacing & Radius

```dart
class AppSpacing {
  static const xs  = 4.0;
  static const sm  = 8.0;
  static const md  = 16.0;
  static const lg  = 24.0;
  static const xl  = 32.0;
  static const xxl = 48.0;
}

class AppRadius {
  static const sm  = 8.0;
  static const md  = 12.0;  // --radius: 0.75rem
  static const lg  = 16.0;
  static const xl  = 24.0;
  static const full = 999.0;
}
```

### 3.4 Shadows

```dart
class AppShadows {
  static final card = [
    BoxShadow(color: Color(0x0F1A2E1A), blurRadius: 3, offset: Offset(0, 1)),
    BoxShadow(color: Color(0x0A1A2E1A), blurRadius: 12, offset: Offset(0, 4)),
  ];
  static final elevated = [
    BoxShadow(color: Color(0x141A2E1A), blurRadius: 20, offset: Offset(0, 4)),
    BoxShadow(color: Color(0x0A1A2E1A), blurRadius: 4, offset: Offset(0, 1)),
  ];
}
```

### 3.5 Gradients

```dart
class AppGradients {
  static const hero = LinearGradient(
    begin: Alignment.topLeft, end: Alignment.bottomRight,
    colors: [Color(0xFF264D33), Color(0xFF2E5E3D)],
  );
  static const accent = LinearGradient(
    begin: Alignment.topLeft, end: Alignment.bottomRight,
    colors: [Color(0xFFE8A317), Color(0xFFED9B1A)],
  );
  static const surface = LinearGradient(
    begin: Alignment.topCenter, end: Alignment.bottomCenter,
    colors: [Color(0xFFF5F7F3), Color(0xFFECEEE9)],
  );
}
```

---

## 4. App Architecture

### 4.1 Clean Architecture Layers

```
lib/
├── core/                    # Shared utilities, theme, constants
│   ├── theme/               # AppColors, AppTypography, AppTheme
│   ├── constants/           # API URLs, keys, enums
│   ├── network/             # Dio client, interceptors, error handling
│   └── utils/               # Helpers, extensions
├── features/                # Feature modules (one per feature)
│   ├── auth/
│   │   ├── data/            # AuthRepository, AuthRemoteDataSource
│   │   ├── domain/          # User model, AuthState
│   │   └── presentation/    # LoginScreen, RegisterScreen, widgets
│   ├── analyzer/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── similarity/
│   ├── brand_prediction/
│   ├── reformulation/
│   ├── embeddings/
│   ├── api_keys/
│   ├── api_playground/
│   ├── usage_analytics/
│   ├── webhooks/
│   ├── dashboard/
│   ├── profile/
│   └── batch_upload/
├── shared/                  # Shared widgets, models
│   ├── widgets/             # AppCard, AppButton, ScoreGauge, etc.
│   ├── models/              # Shared data models
│   └── layouts/             # AppScaffold, BottomNavLayout
└── main.dart
```

### 4.2 Routing (go_router)

```dart
// lib/core/router/app_router.dart

final appRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final isLoggedIn = ref.read(authProvider).isAuthenticated;
    final isAuthRoute = state.matchedLocation.startsWith('/auth');
    if (!isLoggedIn && !isAuthRoute && state.matchedLocation != '/') {
      return '/auth/login';
    }
    if (isLoggedIn && isAuthRoute) return '/dashboard';
    return null;
  },
  routes: [
    // ─── Public ───
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),

    // ─── Auth ───
    GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/auth/register', builder: (_, __) => const RegisterScreen()),
    GoRoute(path: '/auth/verify-otp', builder: (_, __) => const VerifyOTPScreen()),
    GoRoute(path: '/auth/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
    GoRoute(path: '/auth/reset-password', builder: (_, __) => const ResetPasswordScreen()),

    // ─── Main (Shell with Bottom Nav) ───
    ShellRoute(
      builder: (_, __, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/analyzer', builder: (_, __) => const AnalyzerScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),

    // ─── Phase 1 ───
    GoRoute(path: '/batch', builder: (_, __) => const BatchUploadScreen()),
    GoRoute(path: '/additives', builder: (_, __) => const AdditiveDatabaseScreen()),

    // ─── Phase 3 ───
    GoRoute(path: '/similarity', builder: (_, __) => const SimilaritySearchScreen()),
    GoRoute(path: '/brand-prediction', builder: (_, __) => const BrandPredictionScreen()),
    GoRoute(path: '/reformulation', builder: (_, __) => const ReformulationScreen()),
    GoRoute(path: '/embeddings', builder: (_, __) => const EmbeddingsScreen()),

    // ─── Phase 4 ───
    GoRoute(path: '/api-keys', builder: (_, __) => const ApiKeysScreen()),
    GoRoute(path: '/api-playground', builder: (_, __) => const ApiPlaygroundScreen()),
    GoRoute(path: '/api-usage', builder: (_, __) => const ApiUsageScreen()),
    GoRoute(path: '/webhooks', builder: (_, __) => const WebhooksScreen()),
    GoRoute(path: '/pricing', builder: (_, __) => const PricingScreen()),
  ],
);
```

---

## 5. Backend Integration

### 5.1 Base Configuration

The Flutter app connects to the **same Flask backend** as the React web app.

```dart
// lib/core/constants/api_constants.dart

class ApiConstants {
  // ⚠️ Replace with your actual backend URL
  static const baseUrl = 'https://your-api-domain.com';

  // Auth endpoints
  static const login          = '/api/auth/login';
  static const register       = '/api/auth/register';
  static const verifyOtp      = '/api/auth/verify-otp';
  static const forgotPassword = '/api/auth/forgot-password';
  static const resetPassword  = '/api/auth/reset-password';
  static const refreshToken   = '/api/auth/refresh';
  static const googleAuth     = '/api/auth/google';
  static const profile        = '/api/auth/profile';
  static const changePassword = '/api/auth/change-password';
  static const deleteAccount  = '/api/auth/delete-account';

  // Phase 1
  static const analyze        = '/api/analyze';

  // Phase 3
  static const similarProducts   = '/api/similar-products';
  static const predictBrand      = '/api/predict-brand';
  static const detectReformulation = '/api/detect-reformulation';
  static const embeddings        = '/api/embeddings/visualize';

  // Phase 4
  static const apiKeys        = '/api/keys';
  static const apiUsage       = '/api/usage';
  static const webhooks       = '/api/webhooks';
}
```

### 5.2 HTTP Client with Auth Interceptor

```dart
// lib/core/network/api_client.dart

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiClient(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired → attempt refresh or logout
          final refreshed = await _tryRefreshToken();
          if (refreshed) {
            // Retry original request
            handler.resolve(await _dio.fetch(error.requestOptions));
            return;
          }
          // Force logout
          _onSessionExpired();
        }
        handler.next(error);
      },
    ));
  }

  Future<Response> get(String path, {Map<String, dynamic>? params}) =>
      _dio.get(path, queryParameters: params);

  Future<Response> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);

  Future<Response> patch(String path, {dynamic data}) =>
      _dio.patch(path, data: data);

  Future<Response> delete(String path) =>
      _dio.delete(path);
}
```

### 5.3 Response Contract

The backend returns:

```json
// Success (200/201)
{
  "user": { ... },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "refresh...",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}

// Error (4xx/5xx)
{
  "message": "Human-readable error message"
}
```

### 5.4 Token Storage

```dart
// Secure storage keys
class StorageKeys {
  static const accessToken  = 'access_token';
  static const refreshToken = 'refresh_token';
  static const expiresAt    = 'expires_at';
  static const userData     = 'user_data';
}
```

---

## 6. Authentication Flow

### 6.1 Screens

#### Login Screen (`/auth/login`)
```
┌─────────────────────────────┐
│         FoodIntel AI        │  ← Logo + app name
│    Ingredient Intelligence  │  ← Subtitle in mutedForeground
│                             │
│  ┌───────────────────────┐  │
│  │ Email                 │  │  ← TextFormField
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password          👁  │  │  ← Password with visibility toggle
│  └───────────────────────┘  │
│                             │
│  [      Sign In         ]   │  ← Primary button, full width
│                             │
│  ── or continue with ──     │  ← Divider
│                             │
│  [G Google] [🍎 Apple]      │  ← OAuth buttons side by side
│                             │
│  Forgot password?           │  ← TextButton → /auth/forgot-password
│  Don't have an account?     │
│  Sign up                    │  ← TextButton → /auth/register
└─────────────────────────────┘
```

- **Validation**: Email format, password min 6 chars
- **Loading**: Button shows CircularProgressIndicator while awaiting
- **Error**: SnackBar with red background, message from backend
- **Success**: Navigate to `/dashboard`, store tokens securely

#### Register Screen (`/auth/register`)
```
┌─────────────────────────────┐
│       Create Account        │
│                             │
│  ┌───────────────────────┐  │
│  │ Full Name             │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password          👁  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Confirm Password  👁  │  │
│  └───────────────────────┘  │
│                             │
│  [    Create Account    ]   │
│                             │
│  Already have an account?   │
│  Sign in                    │
└─────────────────────────────┘
```

- **POST** `/api/auth/register` with `{ displayName, email, password }`
- On success → navigate to `/auth/verify-otp` passing email

#### OTP Verification (`/auth/verify-otp`)
```
┌─────────────────────────────┐
│       Verify Email          │
│  We sent a code to          │
│  user@example.com           │
│                             │
│   ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ │  ← 6 individual digit fields
│   │ │ │ │ │ │ │ │ │ │ │ │ │     Auto-advance on input
│   └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ │
│                             │
│  [      Verify Code     ]   │
│                             │
│  Didn't receive?            │
│  Resend code (45s)          │  ← Countdown timer
└─────────────────────────────┘
```

- **POST** `/api/auth/verify-otp` with `{ email, otp }`
- Returns `{ user, tokens }` → store and navigate to `/dashboard`

#### Forgot Password (`/auth/forgot-password`)
- Single email field → **POST** `/api/auth/forgot-password`
- Shows success message: "Check your email for reset link"

#### Reset Password (`/auth/reset-password`)
- Two password fields + token from deep link
- **POST** `/api/auth/reset-password` with `{ token, newPassword }`

### 6.2 OAuth Flow

For **Google Sign-In** on mobile:
1. Use `google_sign_in` package to get Google `idToken` natively
2. Send `idToken` to **POST** `/api/auth/google`
3. Backend verifies with Firebase, returns `{ user, tokens }`
4. Store tokens, navigate to dashboard

For **Apple Sign-In** (iOS only):
1. Use `sign_in_with_apple` package
2. Send `identityToken` to **POST** `/api/auth/apple`
3. Same flow as Google

---

## 7. Phase 1 — Core Analysis

### 7.1 Analyzer Screen (`/analyzer`)

This is the **primary feature**. User pastes or types ingredient list → gets full analysis.

```
┌─────────────────────────────────┐
│  ← Back     Ingredient Analyzer │
├─────────────────────────────────┤
│                                 │
│  Paste your ingredient list     │
│  ┌─────────────────────────┐    │
│  │ Water, Sugar, Salt,     │    │  ← Multi-line TextField
│  │ Citric Acid (E330),     │    │     min 3 lines visible
│  │ Sodium Benzoate...      │    │
│  └─────────────────────────┘    │
│                                 │
│  [🔍  Analyze Ingredients   ]   │  ← Primary gradient button
│                                 │
│ ─── Results ────────────────    │
│                                 │
│  ┌─ Score Card ────────────┐    │
│  │  Clean Label Score      │    │
│  │      72 / 100           │    │  ← Circular progress indicator
│  │  ███████░░░  72%        │    │     Animated, color-coded
│  │  "Good — Minor issues"  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─ Health Risk ───────────┐    │
│  │ ⚠️ Medium Risk          │    │  ← Card with colored left border
│  │ 2 concerning additives  │    │
│  │ found in this product   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─ Tabs ──────────────────┐    │
│  │ [Allergens] [Additives] │    │  ← TabBar
│  │ [Stats]                 │    │
│  ├─────────────────────────┤    │
│  │                         │    │
│  │ 🥜 Tree Nuts    HIGH    │    │  ← Allergen list with severity
│  │ 🥛 Dairy        MEDIUM  │    │     Color-coded badges
│  │ 🌾 Gluten       LOW     │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

#### Score Card Widget
- **Circular progress** with animated fill (0→score over 1s)
- Color coding:
  - 80–100: `success` (green)
  - 50–79: `warning` (amber)
  - 0–49: `destructive` (red)
- Label below: "Excellent", "Good", "Fair", "Poor"
- Font: `displayMedium` for the number

#### Allergen Results
- List of detected allergens
- Each row: Icon + Name + Severity Badge
- Severity badges:
  - HIGH → red background, white text
  - MEDIUM → amber background, dark text
  - LOW → green background, dark text
- Source ingredient shown as small text below

#### Additive Results
- Grouped by risk level
- Each additive card:
  - E-number badge (e.g., "E330")
  - Name (e.g., "Citric Acid")
  - Risk level indicator (colored dot)
  - Function text (e.g., "Preservative")
  - Expandable description

#### Ingredient Stats
- Total ingredient count
- Recognized vs unrecognized
- Processing level indicator
- Simple bar chart or stat row

### 7.2 Batch Upload Screen (`/batch`)

```
┌─────────────────────────────────┐
│  ← Back        Batch Upload     │
├─────────────────────────────────┤
│                                 │
│  ┌─ Upload Area ───────────┐    │
│  │                         │    │
│  │     📄 Drop CSV here    │    │  ← Dashed border area
│  │     or tap to browse    │    │     Use file_picker package
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  📋 CSV Format:                 │
│  product_name,ingredients       │
│  "Product A","water,sugar..."   │
│                                 │
│  [   Upload & Analyze    ]      │
│                                 │
│ ─── Results ────────────────    │
│                                 │
│  ┌─ Product A ─────── 85/100 ┐  │  ← Expandable cards
│  │ 12 ingredients │ 2 alerts │  │
│  └───────────────────────────┘  │
│  ┌─ Product B ─────── 42/100 ┐  │
│  │ 8 ingredients │ 5 alerts  │  │
│  └───────────────────────────┘  │
│                                 │
│  [  📥 Export Results (CSV)  ]  │
└─────────────────────────────────┘
```

### 7.3 Additive Database Screen (`/additives`)

```
┌─────────────────────────────────┐
│  ← Back    Additive Database    │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ 🔍 Search additives...  │    │  ← Search with debounce
│  └─────────────────────────┘    │
│                                 │
│  Filter: [All][Safe][Caution]   │  ← Chip filters
│          [Avoid]                │
│                                 │
│  ┌─────────────────────────┐    │
│  │ E100 — Curcumin         │    │
│  │ Colorant │ 🟢 Safe      │    │
│  ├─────────────────────────┤    │
│  │ E211 — Sodium Benzoate  │    │
│  │ Preservative │ 🔴 Avoid │    │
│  ├─────────────────────────┤    │
│  │ ...                     │    │
│  └─────────────────────────┘    │
│                                 │
│  ← 1 2 3 4 5 →                 │  ← Pagination or infinite scroll
└─────────────────────────────────┘
```

---

## 8. Phase 2 — ML Features

### Category Prediction
- Displayed as part of the Analyzer results
- Shows predicted food category with confidence %
- Backend-only feature — requires ML model endpoint
- UI: Badge below score card showing "Predicted: Beverages (92%)"

---

## 9. Phase 3 — Deep Learning / NLP

### 9.1 Similarity Search (`/similarity`)

```
┌──────────────────────────────────┐
│  ← Back     Similarity Search    │
├──────────────────────────────────┤
│                                  │
│  🧬 Find Similar Products        │
│  Powered by BERT embeddings      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Paste ingredients here...  │  │
│  └────────────────────────────┘  │
│                                  │
│  Top K: [━━━━●━━━] 5            │  ← Slider (1–20)
│                                  │
│  [   🔍 Find Similar   ]        │
│                                  │
│ ─── Results ─────────────────    │
│                                  │
│  ┌─────────────────────────┐     │
│  │ 1. Organic Granola Bar  │     │
│  │    Similarity: 94.2%    │     │  ← Linear progress bar
│  │    ████████████████░░   │     │     colored by similarity
│  │    Brand: Nature Valley │     │
│  │    Category: Snacks     │     │
│  ├─────────────────────────┤     │
│  │ 2. Protein Energy Bite  │     │
│  │    Similarity: 87.6%    │     │
│  │    ██████████████░░░░   │     │
│  │    Brand: Kind          │     │
│  └─────────────────────────┘     │
│                                  │
└──────────────────────────────────┘
```

- **POST** `/api/similar-products` with `{ ingredientText, topK }`
- Results: List cards sorted by similarity
- Progress bar color:
  - ≥90%: `success`
  - 70–89%: `accent`
  - <70%: `mutedForeground`

### 9.2 Brand Prediction (`/brand-prediction`)

```
┌──────────────────────────────────┐
│  ← Back     Brand Prediction     │
├──────────────────────────────────┤
│                                  │
│  🧠 AI Brand Classifier          │
│  BERT-powered NLP model          │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Paste ingredients here...  │  │
│  └────────────────────────────┘  │
│                                  │
│  [   🔮 Predict Brand   ]       │
│                                  │
│ ─── Predictions ─────────────    │
│                                  │
│  ┌─────────────────────────┐     │
│  │ 🏆 #1 Nestlé            │     │  ← Gold accent for top
│  │    Confidence: 78.3%    │     │
│  │    ████████████████░░   │     │
│  ├─────────────────────────┤     │
│  │ #2 Unilever             │     │
│  │    Confidence: 12.1%    │     │
│  │    ███░░░░░░░░░░░░░░░   │     │
│  ├─────────────────────────┤     │
│  │ #3 PepsiCo              │     │
│  │    Confidence: 5.4%     │     │
│  └─────────────────────────┘     │
│                                  │
│  ℹ️ Model trained on 10,000+     │
│  USDA products using BERT        │
│  embeddings                      │
└──────────────────────────────────┘
```

- **POST** `/api/predict-brand` with `{ ingredientText }`
- Top prediction gets `accent` colored card with trophy icon
- Others get `card` background
- Show confidence as percentage + progress bar

### 9.3 Reformulation Detection (`/reformulation`)

```
┌──────────────────────────────────┐
│  ← Back   Reformulation Detect   │
├──────────────────────────────────┤
│                                  │
│  🔄 Compare Ingredient Lists     │
│                                  │
│  Original Formula:               │
│  ┌────────────────────────────┐  │
│  │ Water, Sugar, Salt,        │  │  ← TextField
│  │ Citric Acid, Natural       │  │
│  │ Flavors                    │  │
│  └────────────────────────────┘  │
│                                  │
│  Updated Formula:                │
│  ┌────────────────────────────┐  │
│  │ Water, Stevia, Salt,       │  │
│  │ Citric Acid, Vitamin D     │  │
│  └────────────────────────────┘  │
│                                  │
│  [   🔍 Compare   ]             │
│                                  │
│ ─── Analysis ────────────────    │
│                                  │
│  Overall Similarity: 72%         │
│  ████████████████░░░░░░░         │
│                                  │
│  Order Similarity: 85%           │
│  ████████████████████░░░         │
│                                  │
│  ┌─ Changes ───────────────┐     │
│  │ ➕ Added: Stevia         │     │  ← Green text
│  │ ➕ Added: Vitamin D      │     │
│  │ ➖ Removed: Sugar        │     │  ← Red text
│  │ ➖ Removed: Natural Flav │     │
│  │ ⚠️ Impact: Healthier     │     │  ← Info badge
│  │   reformulation detected │     │
│  └──────────────────────────┘    │
│                                  │
└──────────────────────────────────┘
```

- **POST** `/api/detect-reformulation`
- Body: `{ originalIngredients, updatedIngredients }`
- Color coding: additions in `success`, removals in `destructive`
- Impact assessment badge: "Healthier" (green), "Neutral" (gray), "Concerning" (red)

### 9.4 Embedding Explorer (`/embeddings`)

```
┌──────────────────────────────────┐
│  ← Back   Embedding Explorer     │
├──────────────────────────────────┤
│                                  │
│  🔬 Product Embedding Space      │
│  t-SNE visualization of BERT     │
│  embeddings                      │
│                                  │
│  Category: [▼ All Categories ]   │  ← Dropdown filter
│                                  │
│  ┌────────────────────────────┐  │
│  │         ·  · ·             │  │
│  │     · ·    ·  ·            │  │  ← ScatterChart (fl_chart)
│  │   ·  ·  ·     · · ·       │  │     Colored by cluster
│  │      · ·   · ·   ·        │  │     Tap point for tooltip
│  │  ·  ·    ·    · ·         │  │
│  │    ·  · ·  ·   ·          │  │
│  └────────────────────────────┘  │
│                                  │
│  Legend:                         │
│  🔴 Cluster 0 │ 🔵 Cluster 1    │
│  🟢 Cluster 2 │ 🟡 Cluster 3    │
│                                  │
│  Total products: 2,847           │
│  Dimensions reduced: 768 → 2    │
└──────────────────────────────────┘
```

- **POST** `/api/embeddings/visualize` with optional `{ category }`
- Use `fl_chart` ScatterChart
- Each dot = product, colored by cluster
- Tap dot → tooltip with product name + category

---

## 10. Phase 4 — SaaS Developer Tools

### 10.1 API Key Management (`/api-keys`)

```
┌──────────────────────────────────┐
│  ← Back       API Keys           │
├──────────────────────────────────┤
│                                  │
│  🔑 Your API Keys                │
│                                  │
│  [+ Create New Key]              │  ← Opens bottom sheet
│                                  │
│  ┌────────────────────────────┐  │
│  │ Production Key             │  │
│  │ fi_live_****abcd           │  │  ← Masked key
│  │ Environment: 🟢 Live      │  │
│  │ Created: Dec 15, 2024     │  │
│  │ Requests: 1,234           │  │
│  │                            │  │
│  │ [Copy] [Revoke]           │  │
│  ├────────────────────────────┤  │
│  │ Test Key                   │  │
│  │ fi_test_****efgh           │  │
│  │ Environment: 🟡 Test      │  │
│  │ Created: Dec 10, 2024     │  │
│  │ Requests: 56              │  │
│  │                            │  │
│  │ [Copy] [Revoke]           │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘

── Create Key Bottom Sheet ──
┌──────────────────────────────────┐
│  Create API Key                  │
│                                  │
│  Key Name:                       │
│  ┌────────────────────────────┐  │
│  │ My Production Key          │  │
│  └────────────────────────────┘  │
│                                  │
│  Environment:                    │
│  (●) Live  ( ) Test              │  ← Radio buttons
│                                  │
│  Permissions:                    │
│  ☑ analyze  ☑ similar-products   │  ← Checkboxes
│  ☑ predict-brand  ☐ webhooks     │
│                                  │
│  [   Create Key   ]             │
└──────────────────────────────────┘
```

- **GET** `/api/keys` — list keys
- **POST** `/api/keys` — create key (show full key ONCE in dialog)
- **DELETE** `/api/keys/:id` — revoke with confirmation dialog
- Copy to clipboard with haptic feedback

### 10.2 API Playground (`/api-playground`)

```
┌──────────────────────────────────┐
│  ← Back      API Playground      │
├──────────────────────────────────┤
│                                  │
│  Endpoint:                       │
│  [▼ POST /api/analyze        ]   │  ← Dropdown selector
│                                  │
│  Request Body:                   │
│  ┌────────────────────────────┐  │
│  │ {                          │  │  ← Code editor (monospace)
│  │   "ingredients": "water,   │  │     Dark background
│  │   sugar, salt"             │  │
│  │ }                          │  │
│  └────────────────────────────┘  │
│                                  │
│  [▶ Send Request]   ⏱ --ms      │
│                                  │
│  ── Response (200) ──────────    │
│  ┌────────────────────────────┐  │
│  │ {                          │  │  ← Syntax highlighted JSON
│  │   "score": 72,             │  │     Scrollable
│  │   "allergens": [...],      │  │
│  │   "additives": [...]       │  │
│  │ }                          │  │
│  └────────────────────────────┘  │
│                                  │
│  ── cURL ────────────────────    │
│  ┌────────────────────────────┐  │
│  │ curl -X POST ...           │  │  ← Copy button
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

- Pre-fill request body based on selected endpoint
- Show response time, status code (colored badge)
- Auto-generate cURL command
- Endpoints: analyze, similar-products, predict-brand, detect-reformulation

### 10.3 Usage Analytics (`/api-usage`)

```
┌──────────────────────────────────┐
│  ← Back     Usage Analytics      │
├──────────────────────────────────┤
│                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │12.4K │ │ 342  │ │ 45ms │     │  ← Stat cards (horizontal scroll)
│  │Total │ │Today │ │Latency│    │
│  └──────┘ └──────┘ └──────┘     │
│                                  │
│  Daily Requests (30 days)        │
│  ┌────────────────────────────┐  │
│  │  ▐                         │  │  ← Bar chart (fl_chart)
│  │  ▐ ▐     ▐                 │  │
│  │  ▐ ▐ ▐   ▐ ▐               │  │
│  │  ▐ ▐ ▐ ▐ ▐ ▐ ▐             │  │
│  └────────────────────────────┘  │
│                                  │
│  Error Rate: 2.1%                │
│  ┌────────────────────────────┐  │
│  │ Line chart — errors/day    │  │
│  └────────────────────────────┘  │
│                                  │
│  Top Endpoints:                  │
│  ┌────────────────────────────┐  │
│  │ /api/analyze      8,234    │  │
│  │ ██████████████████████     │  │
│  │ /api/similar       2,100   │  │
│  │ █████████                  │  │
│  │ /api/predict-brand   980   │  │
│  │ ████                       │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

- **GET** `/api/usage` with optional `?period=30d`
- Charts: `fl_chart` BarChart + LineChart
- Stat cards scroll horizontally on mobile
- Pull-to-refresh

### 10.4 Webhooks (`/webhooks`)

```
┌──────────────────────────────────┐
│  ← Back       Webhooks           │
├──────────────────────────────────┤
│                                  │
│  🔗 Webhook Endpoints            │
│                                  │
│  [+ Add Webhook]                 │
│                                  │
│  ┌────────────────────────────┐  │
│  │ https://myapp.com/hook     │  │
│  │ Events: analysis.complete, │  │
│  │         batch.complete     │  │
│  │ Status: 🟢 Active          │  │
│  │ Success: 98.5%             │  │
│  │ Last: 2 hours ago          │  │
│  │                            │  │
│  │ [Edit] [Test] [Delete]     │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘

── Add Webhook Bottom Sheet ──
┌──────────────────────────────────┐
│  Configure Webhook               │
│                                  │
│  URL:                            │
│  ┌────────────────────────────┐  │
│  │ https://                    │  │
│  └────────────────────────────┘  │
│                                  │
│  Events:                         │
│  ☑ analysis.complete             │
│  ☑ batch.complete                │
│  ☐ api_key.created              │
│  ☐ api_key.revoked              │
│                                  │
│  [   Save Webhook   ]           │
└──────────────────────────────────┘
```

---

## 11. Navigation & Layout

### 11.1 Bottom Navigation Bar (Main Shell)

The app uses a **bottom navigation bar** for primary navigation (3 tabs):

```
┌────────────────────────────────┐
│                                │
│        [Screen Content]        │
│                                │
├────────────────────────────────┤
│  🏠 Home  │  🔍 Analyze │ 👤 Me │  ← Bottom nav
└────────────────────────────────┘
```

- **Home** → Dashboard with quick actions grid
- **Analyze** → Ingredient analyzer
- **Me** → Profile + settings

### 11.2 Dashboard Quick Actions

The dashboard shows a **grid of cards** linking to all features:

```
┌──────────────────────────────────┐
│  Welcome back, John              │
│  Your ingredient intelligence    │
│                                  │
│  ┌────────┐  ┌────────┐         │
│  │🔍 Anal │  │✨ Simil │         │
│  │  yzer  │  │  arity │         │  ← 2-column grid
│  └────────┘  └────────┘         │
│  ┌────────┐  ┌────────┐         │
│  │🧠 Brand│  │🔄 Refor│         │
│  │Predict │  │mulate  │         │
│  └────────┘  └────────┘         │
│  ┌────────┐  ┌────────┐         │
│  │📤 Batch│  │🔬 Embed│         │
│  │Upload  │  │dings   │         │
│  └────────┘  └────────┘         │
│                                  │
│  ── Developer Tools ──           │
│  ┌────────┐  ┌────────┐         │
│  │🔑 API  │  │▶️ Play │         │
│  │ Keys   │  │ground  │         │
│  └────────┘  └────────┘         │
│  ┌────────┐  ┌────────┐         │
│  │📊 Usage│  │🔗 Web  │         │
│  │       │  │hooks   │         │
│  └────────┘  └────────┘         │
└──────────────────────────────────┘
```

### 11.3 AppBar Pattern

Every screen uses a consistent AppBar:

```dart
AppBar(
  backgroundColor: Colors.transparent,
  elevation: 0,
  leading: BackButton(),
  title: Text('Screen Title', style: AppTypography.displaySmall),
  centerTitle: true,
)
```

---

## 12. Responsive Design

### 12.1 Breakpoints

```dart
class Breakpoints {
  static const mobile  = 0;    // 0–599 dp
  static const tablet  = 600;  // 600–1023 dp
  static const desktop = 1024; // 1024+ dp (landscape tablets, foldables)
}
```

### 12.2 Layout Adaptations

| Element | Mobile (< 600dp) | Tablet (≥ 600dp) |
|---------|-------------------|-------------------|
| Quick Actions Grid | 2 columns | 3 columns |
| Feature Grid | 1 column | 2 columns |
| Analyzer Results | Stacked cards | Side-by-side cards |
| Bottom Nav | 3 tabs | Rail navigation |
| Charts | Full width, horizontal scroll | Larger, no scroll |
| Dialogs | Full-screen bottom sheet | Centered dialog |
| Text Input | Full width | Max 600dp centered |

### 12.3 Responsive Helper

```dart
// lib/core/utils/responsive.dart

class Responsive {
  static bool isMobile(BuildContext context) =>
    MediaQuery.of(context).size.width < 600;

  static bool isTablet(BuildContext context) =>
    MediaQuery.of(context).size.width >= 600;

  static int gridColumns(BuildContext context) =>
    isMobile(context) ? 2 : 3;

  static double maxContentWidth(BuildContext context) =>
    isTablet(context) ? 700 : double.infinity;
}
```

### 12.4 Safe Areas

```dart
SafeArea(
  child: Padding(
    padding: EdgeInsets.symmetric(
      horizontal: Responsive.isMobile(context) ? 16 : 24,
    ),
    child: content,
  ),
)
```

---

## 13. Animations & Micro-interactions

### 13.1 Page Transitions

```dart
// Slide up + fade for feature screens
CustomTransitionPage(
  transitionsBuilder: (_, animation, __, child) {
    return SlideTransition(
      position: Tween(begin: Offset(0, 0.05), end: Offset.zero)
        .animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
      child: FadeTransition(opacity: animation, child: child),
    );
  },
)
```

### 13.2 Staggered List Animation

Use `flutter_animate` for staggered card entry (like framer-motion):

```dart
ListView.builder(
  itemBuilder: (context, index) {
    return CardWidget()
      .animate()
      .fadeIn(delay: Duration(milliseconds: index * 50))
      .slideY(begin: 0.1, end: 0, delay: Duration(milliseconds: index * 50));
  },
)
```

### 13.3 Score Animation

```dart
// Animated circular score
TweenAnimationBuilder<double>(
  tween: Tween(begin: 0, end: score / 100),
  duration: Duration(milliseconds: 1200),
  curve: Curves.easeOutCubic,
  builder: (_, value, __) => CircularProgressIndicator(
    value: value,
    strokeWidth: 8,
    color: _getScoreColor(value * 100),
    backgroundColor: AppColors.muted,
  ),
)
```

### 13.4 Button Press

```dart
// Scale down on press
GestureDetector(
  onTapDown: (_) => _controller.forward(),
  onTapUp: (_) => _controller.reverse(),
  child: ScaleTransition(
    scale: Tween(begin: 1.0, end: 0.96).animate(_controller),
    child: button,
  ),
)
```

### 13.5 Shimmer Loading

```dart
Shimmer.fromColors(
  baseColor: AppColors.muted,
  highlightColor: AppColors.surfaceElevated,
  child: Container(
    height: 120,
    decoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(AppRadius.md),
    ),
  ),
)
```

---

## 14. State Management

### 14.1 Riverpod Providers

```dart
// ─── Auth ───
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiClientProvider), ref.read(secureStorageProvider));
});

// ─── Analysis ───
final analysisProvider = StateNotifierProvider<AnalysisNotifier, AnalysisState>((ref) {
  return AnalysisNotifier(ref.read(apiClientProvider));
});

// ─── Similarity ───
final similarityProvider = FutureProvider.family<List<SimilarProduct>, SimilarityRequest>((ref, req) {
  return ref.read(apiClientProvider).post(ApiConstants.similarProducts, data: req.toJson());
});

// ─── Brand Prediction ───
final brandPredictionProvider = FutureProvider.family<List<BrandPrediction>, String>((ref, text) {
  return ref.read(apiClientProvider).post(ApiConstants.predictBrand, data: {'ingredientText': text});
});

// ─── API Keys ───
final apiKeysProvider = StateNotifierProvider<ApiKeysNotifier, AsyncValue<List<ApiKey>>>((ref) {
  return ApiKeysNotifier(ref.read(apiClientProvider));
});
```

### 14.2 Auth State

```dart
@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = _Initial;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.authenticated(User user) = _Authenticated;
  const factory AuthState.unauthenticated() = _Unauthenticated;
  const factory AuthState.error(String message) = _Error;
}
```

---

## 15. Error Handling & Loading States

### 15.1 Error Display

```dart
// Global error handler
void showError(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message, style: TextStyle(color: Colors.white)),
      backgroundColor: AppColors.destructive,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.sm)),
      margin: EdgeInsets.all(AppSpacing.md),
    ),
  );
}
```

### 15.2 Loading States per Screen

| Screen | Loading State |
|--------|--------------|
| Analyzer | Button shows spinner, results area shows shimmer cards |
| Similarity | Full-height shimmer list |
| Brand Prediction | Pulsing brain icon + "Analyzing with BERT..." |
| Reformulation | Progress bar with "Comparing formulas..." |
| Embeddings | Placeholder chart with loading overlay |
| API Keys | Shimmer list |
| Usage | Shimmer stat cards + chart placeholder |

### 15.3 Empty States

```dart
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  // Renders centered icon + text + optional CTA button
}
```

### 15.4 Network Error

```dart
class NetworkErrorWidget extends StatelessWidget {
  // Shows: 📡 icon + "No internet connection" + "Retry" button
  // Used when connectivity_plus reports offline
}
```

---

## 16. Offline Support

### 16.1 Strategy

| Feature | Offline Behavior |
|---------|-----------------|
| Analyzer (Phase 1) | ✅ Full offline — uses local analysis engine |
| Additive Database | ✅ Cached locally on first load |
| Phase 3 features | ❌ Requires backend — show "Offline" message |
| Phase 4 features | ❌ Requires backend — show cached last data |

### 16.2 Local Analysis Engine

Port the existing TypeScript engines to Dart:
- `additive-engine.ts` → `lib/features/analyzer/data/additive_engine.dart`
- `allergen-engine.ts` → `lib/features/analyzer/data/allergen_engine.dart`
- `health-risk-engine.ts` → `lib/features/analyzer/data/health_risk_engine.dart`
- `ingredient-processor.ts` → `lib/features/analyzer/data/ingredient_processor.dart`

These run entirely on-device, same as the React web app's client-side fallback.

---

## 17. File Structure

```
lib/
├── main.dart
├── app.dart                          # MaterialApp + theme + router
│
├── core/
│   ├── theme/
│   │   ├── app_colors.dart
│   │   ├── app_typography.dart
│   │   ├── app_theme.dart            # ThemeData light + dark
│   │   ├── app_shadows.dart
│   │   └── app_gradients.dart
│   ├── constants/
│   │   ├── api_constants.dart
│   │   └── storage_keys.dart
│   ├── network/
│   │   ├── api_client.dart           # Dio + interceptors
│   │   └── api_exceptions.dart
│   ├── router/
│   │   └── app_router.dart
│   └── utils/
│       ├── responsive.dart
│       └── validators.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── auth_repository.dart
│   │   │   └── auth_remote_source.dart
│   │   ├── domain/
│   │   │   ├── user_model.dart
│   │   │   └── auth_state.dart
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── login_screen.dart
│   │       │   ├── register_screen.dart
│   │       │   ├── verify_otp_screen.dart
│   │       │   ├── forgot_password_screen.dart
│   │       │   └── reset_password_screen.dart
│   │       └── widgets/
│   │           ├── oauth_buttons.dart
│   │           └── otp_input.dart
│   │
│   ├── analyzer/
│   │   ├── data/
│   │   │   ├── analysis_repository.dart
│   │   │   ├── additive_engine.dart     # Ported from TS
│   │   │   ├── allergen_engine.dart
│   │   │   ├── health_risk_engine.dart
│   │   │   └── ingredient_processor.dart
│   │   ├── domain/
│   │   │   ├── analysis_result.dart
│   │   │   ├── allergen.dart
│   │   │   └── additive.dart
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── analyzer_screen.dart
│   │       └── widgets/
│   │           ├── ingredient_input.dart
│   │           ├── score_card.dart
│   │           ├── health_risk_card.dart
│   │           ├── allergen_results.dart
│   │           ├── additive_results.dart
│   │           └── ingredient_stats.dart
│   │
│   ├── batch_upload/
│   │   └── presentation/screens/batch_upload_screen.dart
│   │
│   ├── additive_database/
│   │   └── presentation/screens/additive_database_screen.dart
│   │
│   ├── similarity/
│   │   ├── data/similarity_repository.dart
│   │   ├── domain/similar_product.dart
│   │   └── presentation/
│   │       ├── screens/similarity_search_screen.dart
│   │       └── widgets/similarity_result_card.dart
│   │
│   ├── brand_prediction/
│   │   ├── data/brand_repository.dart
│   │   ├── domain/brand_prediction.dart
│   │   └── presentation/
│   │       ├── screens/brand_prediction_screen.dart
│   │       └── widgets/prediction_card.dart
│   │
│   ├── reformulation/
│   │   ├── data/reformulation_repository.dart
│   │   ├── domain/reformulation_result.dart
│   │   └── presentation/
│   │       ├── screens/reformulation_screen.dart
│   │       └── widgets/change_item.dart
│   │
│   ├── embeddings/
│   │   ├── data/embedding_repository.dart
│   │   ├── domain/embedding_point.dart
│   │   └── presentation/
│   │       └── screens/embeddings_screen.dart
│   │
│   ├── api_keys/
│   │   ├── data/api_keys_repository.dart
│   │   ├── domain/api_key.dart
│   │   └── presentation/
│   │       ├── screens/api_keys_screen.dart
│   │       └── widgets/api_key_card.dart
│   │
│   ├── api_playground/
│   │   └── presentation/screens/api_playground_screen.dart
│   │
│   ├── usage_analytics/
│   │   ├── data/usage_repository.dart
│   │   ├── domain/usage_stats.dart
│   │   └── presentation/
│   │       ├── screens/api_usage_screen.dart
│   │       └── widgets/usage_chart.dart
│   │
│   ├── webhooks/
│   │   ├── data/webhooks_repository.dart
│   │   ├── domain/webhook_config.dart
│   │   └── presentation/
│   │       ├── screens/webhooks_screen.dart
│   │       └── widgets/webhook_card.dart
│   │
│   ├── dashboard/
│   │   └── presentation/
│   │       ├── screens/dashboard_screen.dart
│   │       └── widgets/
│   │           ├── quick_action_card.dart
│   │           └── feature_status_card.dart
│   │
│   └── profile/
│       └── presentation/screens/profile_screen.dart
│
└── shared/
    ├── widgets/
    │   ├── app_card.dart              # Elevated card with shadow
    │   ├── app_button.dart            # Primary/outline/ghost variants
    │   ├── app_text_field.dart        # Styled input
    │   ├── app_badge.dart             # Status badge
    │   ├── loading_shimmer.dart
    │   ├── empty_state.dart
    │   ├── network_error.dart
    │   └── score_gauge.dart           # Circular progress
    ├── models/
    │   └── api_response.dart
    └── layouts/
        ├── main_shell.dart            # Bottom nav shell
        └── feature_scaffold.dart      # AppBar + SafeArea + padding
```

---

## 18. Screen-by-Screen Specification

### 18.1 Home / Landing (Unauthenticated)

Only shown to non-logged-in users. Simple hero + CTA.

```
┌──────────────────────────────────┐
│                                  │
│  [Logo]  FoodIntel AI            │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │  Decode Every              │  │  ← Hero gradient background
│  │  Ingredient                │  │     Playfair Display, bold
│  │                            │  │
│  │  AI-powered food           │  │  ← DM Sans, muted
│  │  ingredient analysis       │  │
│  │                            │  │
│  │  [Get Started]  [Login]    │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  ── Features ──                  │
│  ┌────────┐ ┌────────┐          │
│  │🛡 Aller│ │🧪 Addit│          │
│  │  gen   │ │  ive   │          │
│  └────────┘ └────────┘          │
│  ┌────────┐                     │
│  │❤ Health│                     │
│  │ Score  │                     │
│  └────────┘                     │
│                                  │
└──────────────────────────────────┘
```

### 18.2 Dashboard (Authenticated)

See Section 11.2 — Quick actions grid + developer tools + subscription card.

### 18.3 Profile (`/profile`)

```
┌──────────────────────────────────┐
│  ← Back        Profile           │
├──────────────────────────────────┤
│                                  │
│       ┌───┐                      │
│       │ JD │  ← Avatar circle    │
│       └───┘     with initials    │
│    John Doe                      │
│    john@example.com              │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 📧 Change Email           →│  │
│  ├────────────────────────────┤  │
│  │ 🔒 Change Password        →│  │
│  ├────────────────────────────┤  │
│  │ 🌙 Dark Mode         [🔘] │  │  ← Switch
│  ├────────────────────────────┤  │
│  │ 📄 Documentation          →│  │
│  ├────────────────────────────┤  │
│  │ 💳 Subscription           →│  │
│  └────────────────────────────┘  │
│                                  │
│  [ Sign Out ]                    │  ← Destructive style
│                                  │
│  App Version 1.0.0               │
└──────────────────────────────────┘
```

### 18.4 Pricing (`/pricing`)

```
┌──────────────────────────────────┐
│  ← Back        Pricing           │
├──────────────────────────────────┤
│                                  │
│  Choose Your Plan                │
│                                  │
│  ┌── Free ─────────────────┐     │
│  │ $0/month                │     │
│  │ ✓ Unlimited Phase 1     │     │
│  │ ✓ 50 API calls/day      │     │
│  │ ✓ Basic support         │     │
│  │ [Current Plan]          │     │
│  └─────────────────────────┘     │
│                                  │
│  ┌── Pro ──────────────────┐     │
│  │ ⭐ POPULAR              │     │  ← Accent border
│  │ $29/month               │     │
│  │ ✓ All features          │     │
│  │ ✓ 10,000 API calls/day  │     │
│  │ ✓ Priority support      │     │
│  │ ✓ Webhooks              │     │
│  │ [Upgrade]               │     │
│  └─────────────────────────┘     │
│                                  │
│  ┌── Enterprise ───────────┐     │
│  │ Custom pricing          │     │
│  │ ✓ Unlimited everything  │     │
│  │ ✓ Dedicated support     │     │
│  │ ✓ Custom models         │     │
│  │ [Contact Sales]         │     │
│  └─────────────────────────┘     │
│                                  │
└──────────────────────────────────┘
```

---

## Quick Start for AI Agent

### Prompt to use:

> Build a Flutter mobile app based on the specification in `docs/FLUTTER_APP_SPECIFICATION.md`. Follow these priorities:
>
> 1. Set up the project structure exactly as described in Section 17
> 2. Implement the design system (colors, typography, shadows) from Section 3
> 3. Build authentication flow (Section 6) with Firebase + Flask backend
> 4. Build the analyzer screen (Section 7.1) with local analysis engines
> 5. Build Phase 3 screens (Section 9) — similarity, brand prediction, reformulation, embeddings
> 6. Build Phase 4 screens (Section 10) — API keys, playground, usage, webhooks
> 7. Add navigation (Section 11) with bottom nav + go_router
> 8. Add animations (Section 13) using flutter_animate
> 9. Ensure responsive design (Section 12) for phones and tablets
>
> Backend URL: `https://your-api-domain.com` (same Flask backend as the web app)
> Use Riverpod for state management, Dio for HTTP, go_router for navigation.
> Follow the exact color palette, typography, and component patterns described.

---

*Last updated: February 2025*
*Web frontend version: React + Vite + Tailwind*
*Backend: Flask + Firebase + PostgreSQL*
