"""
Production Security Middleware
- Redis-backed rate limiting (survives restarts, shared across workers)
- Anonymous fingerprinting with admin-controlled free tier limits
- Subscription enforcement on backend
- API key validation with tier-based limits
- Abuse detection & IP blocking
"""

import hashlib
import time
import secrets
from functools import wraps
from flask import request, jsonify, g
from app.utils.redis_client import get_redis
from app.utils.jwt_utils import verify_token

# Number of trusted reverse-proxy hops in front of Flask.
# Set to 1 when behind exactly one nginx. Set to 0 to always use remote_addr.
_TRUSTED_PROXY_DEPTH = 1


# ─── Helpers ────────────────────────────────────────────────────────────────

def _get_real_ip() -> str:
    """
    Return the real client IP, resistant to X-Forwarded-For spoofing.
    Only trusts the last _TRUSTED_PROXY_DEPTH entries appended by our proxy.
    """
    if _TRUSTED_PROXY_DEPTH == 0:
        return request.remote_addr or '0.0.0.0'

    xff = request.headers.get('X-Forwarded-For', '').strip()
    if not xff:
        return request.remote_addr or '0.0.0.0'

    # XFF: "client, proxy1, proxy2"  — rightmost N entries are from our proxies
    ips = [ip.strip() for ip in xff.split(',')]
    # The entry just before our trusted proxies is the real client
    idx = max(0, len(ips) - _TRUSTED_PROXY_DEPTH)
    return ips[idx] or request.remote_addr or '0.0.0.0'


def _get_settings() -> dict:
    """Fetch platform settings from Firestore, cached in Redis for 60 s."""
    r = get_redis()
    if r:
        cached = r.get('settings:public')
        if cached:
            import json
            return json.loads(cached)
    try:
        from firebase_admin import firestore
        db = firestore.client()
        doc = db.collection('platform_settings').document('main').get()
        settings = doc.to_dict() if doc.exists else {}
    except Exception:
        settings = {}
    defaults = {
        'freeAnalysisLimit': 10,
        'maintenanceMode': 'off',
        'registrationOpen': True,
        'anonRateLimitPerHour': 20,
        'authRateLimitPerHour': 200,
        'apiKeyRateLimitPerMinute': 60,
        'blockedIPs': [],
        'allowAnonymousAnalysis': True,
    }
    merged = {**defaults, **settings}
    if r:
        import json
        r.setex('settings:public', 60, json.dumps(merged, default=str))
    return merged


def _get_client_fingerprint() -> str:
    """SHA-256 of real IP + User-Agent for anonymous tracking (full 64-char hex)."""
    ip = _get_real_ip()
    ua = request.headers.get('User-Agent', '')
    return hashlib.sha256(f"{ip}:{ua}".encode()).hexdigest()


def _redis_rate_check(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """
    Sliding-window rate check using a Redis sorted set.
    Returns (allowed, remaining).
    Counts BEFORE adding the current request to avoid the off-by-one race.
    Falls back to allow=True when Redis is unavailable.
    """
    r = get_redis()
    if not r:
        return True, limit

    now = time.time()
    unique_member = f"{now:.6f}-{secrets.token_hex(8)}"

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, 0, now - window_seconds)   # evict stale
    pipe.zcard(key)                                        # count BEFORE this request
    pipe.zadd(key, {unique_member: now})                   # add this request
    pipe.expire(key, window_seconds + 1)
    results = pipe.execute()

    count_before = results[1]
    allowed = count_before < limit
    remaining = max(0, limit - count_before - 1)
    return allowed, remaining


def _is_ip_blocked(ip: str, settings: dict) -> bool:
    return ip in settings.get('blockedIPs', [])


# ─── Decorators ─────────────────────────────────────────────────────────────

def rate_limit_by_user(limit: int, window: int = 3600, scope: str = 'api'):
    """
    Rate limit by authenticated user ID (or fingerprint for anon).
    window is always treated as 3600 s (1 hour) for hourly admin-configured limits.
    The `window` parameter is kept for API compatibility but overridden to 3600
    when using admin-configured hourly limits.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            settings = _get_settings()
            ip = _get_real_ip()

            if _is_ip_blocked(ip, settings):
                return jsonify({'error': 'Access denied', 'code': 'IP_BLOCKED'}), 403

            user_id = getattr(g, 'user_id', None)
            if user_id:
                key = f"rl:{scope}:user:{user_id}"
                effective_limit = int(settings.get('authRateLimitPerHour', limit))
                effective_window = 3600  # always per-hour for auth users
            else:
                fp = _get_client_fingerprint()
                key = f"rl:{scope}:anon:{fp}"
                effective_limit = int(settings.get('anonRateLimitPerHour', limit))
                effective_window = 3600  # always per-hour for anon users

            allowed, remaining = _redis_rate_check(key, effective_limit, effective_window)
            if not allowed:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'retryAfter': effective_window,
                    'limit': effective_limit,
                }), 429
            return f(*args, **kwargs)
        return wrapped
    return decorator


def require_auth_or_anon(f):
    """
    Attach user to g if a valid JWT/ApiKey is present; set g.user_id = None otherwise.
    - Invalid/expired tokens → 401 (NOT silently treated as anonymous)
    - Invalid API keys → 401
    - No Authorization header → anonymous (g.user_id = None)
    """
    @wraps(f)
    def wrapped(*args, **kwargs):
        g.user_id = None
        g.user_email = None
        g.is_api_key = False
        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            if not token:
                return jsonify({'error': 'Empty bearer token', 'code': 'INVALID_TOKEN'}), 401
            try:
                payload = verify_token(token)
                g.user_id = payload.get('uid')
                g.user_email = payload.get('email')
            except Exception as exc:
                msg = str(exc).lower()
                if 'expired' in msg:
                    return jsonify({'error': 'Token expired', 'code': 'TOKEN_EXPIRED'}), 401
                return jsonify({'error': 'Invalid token', 'code': 'INVALID_TOKEN'}), 401

        elif auth_header.startswith('ApiKey '):
            raw_key = auth_header[7:].strip()
            if not raw_key:
                return jsonify({'error': 'Empty API key', 'code': 'INVALID_API_KEY'}), 401
            try:
                from app.services.phase4_service import phase4_service
                key_data = phase4_service.validate_api_key(raw_key)
                if not key_data:
                    return jsonify({'error': 'Invalid or revoked API key', 'code': 'INVALID_API_KEY'}), 401
                g.user_id = key_data['user_id']
                g.is_api_key = True
                g.api_key_data = key_data
            except Exception:
                return jsonify({'error': 'API key validation failed', 'code': 'API_KEY_ERROR'}), 401

        elif auth_header:
            # Unknown scheme — reject rather than silently treat as anon
            return jsonify({'error': 'Unsupported authorization scheme', 'code': 'INVALID_AUTH'}), 401

        return f(*args, **kwargs)
    return wrapped


def enforce_free_limit(f):
    """
    For /api/analyze:
    - Authenticated users: enforce subscription limits
    - Anonymous users: enforce admin-controlled free limit per fingerprint
    Must be used AFTER @require_auth_or_anon.
    """
    @wraps(f)
    def wrapped(*args, **kwargs):
        settings = _get_settings()

        if settings.get('maintenanceMode') == 'full':
            return jsonify({'error': 'Platform under maintenance', 'code': 'MAINTENANCE'}), 503

        if g.user_id:
            allowed, reason = _check_subscription_limit(g.user_id)
            if not allowed:
                return jsonify({'error': reason, 'code': 'LIMIT_EXCEEDED', 'upgrade': True}), 402
        else:
            # Check master anonymous-access switch first
            if not settings.get('allowAnonymousAnalysis', True):
                return jsonify({
                    'error': 'Please sign in to use this feature',
                    'code': 'AUTH_REQUIRED',
                }), 401

            free_limit = int(settings.get('freeAnalysisLimit', 10))
            if free_limit == 0:
                return jsonify({
                    'error': 'Please sign in to use this feature',
                    'code': 'AUTH_REQUIRED',
                }), 401

            fp = _get_client_fingerprint()
            key = f"free:analyze:{fp}"
            r = get_redis()
            if r:
                count = r.incr(key)
                if count == 1:
                    r.expire(key, 86400)  # 24-hour window
                if count > free_limit:
                    return jsonify({
                        'error': f'Free limit of {free_limit} analyses reached. Sign up for more.',
                        'code': 'FREE_LIMIT_EXCEEDED',
                        'freeLimit': free_limit,
                        'signup': True,
                    }), 402

        return f(*args, **kwargs)
    return wrapped


def _check_subscription_limit(user_id: str) -> tuple[bool, str]:
    """Check if user has remaining analyses in their active subscription."""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        subs = (
            db.collection('subscriptions')
            .where('userId', '==', user_id)
            .where('status', '==', 'active')
            .limit(1)
            .stream()
        )
        sub_list = list(subs)
        if not sub_list:
            return True, ''  # No subscription → free tier, allow
        sub = sub_list[0].to_dict()
        limit = sub.get('analysesLimit', -1)
        used = sub.get('analysesUsed', 0)
        if limit != -1 and used >= limit:
            return False, f'Monthly analysis limit of {limit} reached. Please upgrade your plan.'
        return True, ''
    except Exception:
        return True, ''  # Fail open on DB errors


def require_pro(f):
    """
    Requires:
    1. Valid JWT (logged in) — 401 if missing/invalid
    2. Active 'pro' or 'superadmin'/'admin' subscription — 402 if free tier
    3. Rate limit: 10 diet plans per 24h per user
    Redis-caches subscription status for 5 minutes to avoid Firestore hammering.
    """
    @wraps(f)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Login required to access this feature',
                'code': 'AUTH_REQUIRED',
                'login': True,
            }), 401

        token = auth_header[7:].strip()
        if not token:
            return jsonify({'error': 'Empty bearer token', 'code': 'INVALID_TOKEN'}), 401

        try:
            payload = verify_token(token)
        except Exception as exc:
            msg = str(exc).lower()
            if 'expired' in msg:
                return jsonify({'error': 'Session expired. Please log in again.', 'code': 'TOKEN_EXPIRED', 'login': True}), 401
            return jsonify({'error': 'Invalid token', 'code': 'INVALID_TOKEN', 'login': True}), 401

        user_id = payload.get('uid')
        g.user_id = user_id
        g.user_email = payload.get('email')

        # Check pro subscription (Redis-cached 5 min)
        r = get_redis()
        cache_key = f"pro_check:{user_id}"
        is_pro = False

        if r:
            cached = r.get(cache_key)
            if cached is not None:
                is_pro = cached == b'1'
            else:
                is_pro = _is_pro_user(user_id)
                r.setex(cache_key, 300, b'1' if is_pro else b'0')
        else:
            is_pro = _is_pro_user(user_id)

        if not is_pro:
            return jsonify({
                'error': 'This feature requires a Pro subscription. Upgrade to access AI diet plans.',
                'code': 'PRO_REQUIRED',
                'upgrade': True,
            }), 402

        # Rate limit: 10 diet plans per 24h per user
        rl_key = f"rl:diet:{user_id}"
        allowed, remaining = _redis_rate_check(rl_key, 10, 86400)
        if not allowed:
            return jsonify({
                'error': 'Daily diet plan limit reached (10/day). Try again tomorrow.',
                'code': 'DIET_RATE_LIMIT',
                'retryAfter': 86400,
            }), 429

        return f(*args, **kwargs)
    return wrapped


def _is_pro_user(user_id: str) -> bool:
    """Check if user has an active pro/enterprise subscription or is admin."""
    try:
        # Check Firebase custom claims first (admins always get pro access)
        from firebase_admin import auth as fb_auth
        user_record = fb_auth.get_user(user_id)
        role = (user_record.custom_claims or {}).get('role', '')
        if role in ('admin', 'superadmin'):
            return True
    except Exception:
        pass

    try:
        from firebase_admin import firestore
        db = firestore.client()
        subs = (
            db.collection('subscriptions')
            .where('userId', '==', user_id)
            .where('status', '==', 'active')
            .limit(5)
            .stream()
        )
        pro_plans = {'pro', 'enterprise', 'professional'}
        for sub in subs:
            if sub.to_dict().get('planId', '').lower() in pro_plans:
                return True
    except Exception:
        pass
    return False


    """Enforce minimum API key tier for developer API endpoints."""
    tier_order = {'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3}

    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('ApiKey '):
                return jsonify({'error': 'API key required', 'code': 'API_KEY_REQUIRED'}), 401
            raw_key = auth_header[7:].strip()
            if not raw_key:
                return jsonify({'error': 'Empty API key', 'code': 'INVALID_API_KEY'}), 401
            try:
                from app.services.phase4_service import phase4_service
                key_data = phase4_service.validate_api_key(raw_key)
                if not key_data:
                    return jsonify({'error': 'Invalid or revoked API key', 'code': 'INVALID_API_KEY'}), 401
                key_tier = key_data.get('tier', 'free')
                if tier_order.get(key_tier, 0) < tier_order.get(min_tier, 0):
                    return jsonify({
                        'error': f'This endpoint requires {min_tier} tier or above',
                        'code': 'TIER_INSUFFICIENT',
                        'yourTier': key_tier,
                        'requiredTier': min_tier,
                    }), 403
                settings = _get_settings()
                rpm = int(settings.get('apiKeyRateLimitPerMinute', 60))
                rl_key = f"rl:apikey:{key_data['id']}"
                allowed, _ = _redis_rate_check(rl_key, rpm, 60)
                if not allowed:
                    return jsonify({'error': 'API key rate limit exceeded', 'retryAfter': 60}), 429
                g.user_id = key_data['user_id']
                g.api_key_data = key_data
                g.is_api_key = True
            except Exception:
                return jsonify({'error': 'API key validation failed', 'code': 'API_KEY_ERROR'}), 401
            return f(*args, **kwargs)
        return wrapped
    return decorator
