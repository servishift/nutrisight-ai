"""
JWT utilities — Redis-backed refresh token storage.
Refresh tokens survive server restarts and are shared across all gunicorn workers.
Falls back to in-memory dict if Redis is unavailable (dev mode).
"""
import jwt
import secrets
import json
from datetime import datetime, timedelta
from app.config import Config
from app.utils.redis_client import get_redis

# Fallback in-memory store (single-worker dev only)
_fallback_tokens: dict = {}

REFRESH_TTL_DAYS = 30
REFRESH_TTL_SECONDS = REFRESH_TTL_DAYS * 86400


def _rt_key(token: str) -> str:
    return f"rt:{token}"


def _store_refresh_token(token: str, uid: str, email: str):
    payload = json.dumps({'uid': uid, 'email': email})
    r = get_redis()
    if r:
        r.setex(_rt_key(token), REFRESH_TTL_SECONDS, payload)
    else:
        _fallback_tokens[token] = {
            'uid': uid, 'email': email,
            'expires': datetime.utcnow() + timedelta(days=REFRESH_TTL_DAYS)
        }


def _get_refresh_token(token: str) -> dict | None:
    r = get_redis()
    if r:
        raw = r.get(_rt_key(token))
        return json.loads(raw) if raw else None
    stored = _fallback_tokens.get(token)
    if stored and datetime.utcnow() < stored['expires']:
        return {'uid': stored['uid'], 'email': stored['email']}
    return None


def _delete_refresh_token(token: str):
    r = get_redis()
    if r:
        r.delete(_rt_key(token))
    else:
        _fallback_tokens.pop(token, None)


def create_tokens(uid: str, email: str) -> dict:
    now = datetime.utcnow()
    expires = now + timedelta(hours=Config.JWT_EXPIRY_HOURS)

    access_token = jwt.encode({
        'uid': uid,
        'email': email,
        'exp': expires,
        'iat': now,
    }, Config.JWT_SECRET, algorithm='HS256')

    refresh_token = secrets.token_urlsafe(40)
    _store_refresh_token(refresh_token, uid, email)

    return {
        'accessToken': access_token,
        'refreshToken': refresh_token,
        'expiresAt': int(expires.timestamp() * 1000),
    }


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')


def refresh_access_token(refresh_token: str) -> dict:
    stored = _get_refresh_token(refresh_token)
    if not stored:
        raise Exception('Invalid or expired refresh token')
    _delete_refresh_token(refresh_token)
    return create_tokens(stored['uid'], stored['email'])


def invalidate_refresh_token(refresh_token: str):
    _delete_refresh_token(refresh_token)


def create_reset_token(email: str) -> str:
    expires = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode({
        'email': email,
        'exp': expires,
        'purpose': 'reset',
    }, Config.JWT_SECRET, algorithm='HS256')


def verify_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        if payload.get('purpose') != 'reset':
            raise Exception('Invalid token purpose')
        return payload['email']
    except Exception:
        raise Exception('Invalid or expired reset token')
