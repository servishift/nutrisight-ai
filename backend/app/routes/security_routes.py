"""
Admin Security Control Panel
Full control over: free tier limits, rate limits, IP blocking,
maintenance mode, subscription enforcement, anonymous access.
All changes take effect within 60 seconds (Redis cache TTL).
"""
from flask import Blueprint, request, jsonify
from app.middleware.admin_middleware import require_admin, require_superadmin
from app.services import admin_service
from datetime import datetime, timezone

security_bp = Blueprint('security', __name__, url_prefix='/api/admin/security')


def _get_db():
    from firebase_admin import firestore
    return firestore.client()


def _get_settings_doc():
    db = _get_db()
    return db.collection('platform_settings').document('main')


def _invalidate_settings_cache():
    from app.utils.redis_client import get_redis
    r = get_redis()
    if r:
        r.delete('settings:public')


# ─── Read current security settings ─────────────────────────────────────────

@security_bp.route('', methods=['GET'])
@require_admin
def get_security_settings(current_user):
    """Get all security & access control settings."""
    try:
        doc = _get_settings_doc().get()
        settings = doc.to_dict() if doc.exists else {}
        defaults = {
            'freeAnalysisLimit': 10,
            'maintenanceMode': 'off',
            'registrationOpen': True,
            'anonRateLimitPerHour': 20,
            'authRateLimitPerHour': 200,
            'apiKeyRateLimitPerMinute': 60,
            'blockedIPs': [],
            'requireEmailVerification': False,
            'maxApiKeysPerUser': 5,
            'allowAnonymousAnalysis': True,
        }
        return jsonify({**defaults, **settings}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ─── Update security settings ────────────────────────────────────────────────

@security_bp.route('', methods=['PUT'])
@require_superadmin
def update_security_settings(current_user):
    """
    Update security settings. Changes take effect within 60s.
    Controllable fields:
      - freeAnalysisLimit (int): 0 = disable anonymous, N = allow N free analyses per 24h
      - maintenanceMode (str): 'off' | 'partial' | 'full'
      - registrationOpen (bool)
      - anonRateLimitPerHour (int): rate limit for anonymous users
      - authRateLimitPerHour (int): rate limit for authenticated users
      - apiKeyRateLimitPerMinute (int): rate limit per API key
      - requireEmailVerification (bool)
      - maxApiKeysPerUser (int)
      - allowAnonymousAnalysis (bool): master switch for anonymous access
    """
    try:
        data = request.get_json()
        allowed_fields = {
            'freeAnalysisLimit', 'maintenanceMode', 'registrationOpen',
            'anonRateLimitPerHour', 'authRateLimitPerHour', 'apiKeyRateLimitPerMinute',
            'requireEmailVerification', 'maxApiKeysPerUser', 'allowAnonymousAnalysis',
        }
        update = {k: v for k, v in data.items() if k in allowed_fields}
        if not update:
            return jsonify({'message': 'No valid fields to update'}), 400

        update['updatedAt'] = datetime.now(timezone.utc)
        update['updatedBy'] = current_user['email']

        doc_ref = _get_settings_doc()
        doc_ref.set(update, merge=True)
        _invalidate_settings_cache()

        admin_service.log_audit(
            current_user['uid'], current_user['email'],
            'security.settings_updated', 'platform_settings', 'main',
            f'Updated: {list(update.keys())}'
        )
        return jsonify({'message': 'Security settings updated', 'updated': update}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ─── IP Blocking ─────────────────────────────────────────────────────────────

@security_bp.route('/blocked-ips', methods=['GET'])
@require_admin
def get_blocked_ips(current_user):
    """Get list of blocked IPs."""
    try:
        doc = _get_settings_doc().get()
        ips = doc.to_dict().get('blockedIPs', []) if doc.exists else []
        return jsonify({'blockedIPs': ips, 'count': len(ips)}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@security_bp.route('/blocked-ips', methods=['POST'])
@require_admin
def block_ip(current_user):
    """Block an IP address."""
    try:
        from firebase_admin import firestore
        ip = request.get_json().get('ip', '').strip()
        if not ip:
            return jsonify({'message': 'IP address required'}), 400

        _get_settings_doc().update({'blockedIPs': firestore.ArrayUnion([ip])})
        _invalidate_settings_cache()

        admin_service.log_audit(
            current_user['uid'], current_user['email'],
            'security.ip_blocked', 'platform_settings', 'main', f'Blocked IP: {ip}'
        )
        return jsonify({'message': f'IP {ip} blocked'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@security_bp.route('/blocked-ips', methods=['DELETE'])
@require_admin
def unblock_ip(current_user):
    """Unblock an IP address."""
    try:
        from firebase_admin import firestore
        ip = request.get_json().get('ip', '').strip()
        if not ip:
            return jsonify({'message': 'IP address required'}), 400

        _get_settings_doc().update({'blockedIPs': firestore.ArrayRemove([ip])})
        _invalidate_settings_cache()

        admin_service.log_audit(
            current_user['uid'], current_user['email'],
            'security.ip_unblocked', 'platform_settings', 'main', f'Unblocked IP: {ip}'
        )
        return jsonify({'message': f'IP {ip} unblocked'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ─── Anonymous Usage Stats ───────────────────────────────────────────────────

@security_bp.route('/anonymous-usage', methods=['GET'])
@require_admin
def get_anonymous_usage(current_user):
    """Get anonymous user usage stats from Redis."""
    try:
        from app.utils.redis_client import get_redis
        r = get_redis()
        if not r:
            return jsonify({'message': 'Redis unavailable'}), 503

        keys = r.keys('free:analyze:*')
        stats = []
        for key in keys[:100]:  # cap at 100
            count = r.get(key)
            ttl = r.ttl(key)
            stats.append({
                'fingerprint': key.replace('free:analyze:', ''),
                'count': int(count) if count else 0,
                'ttlSeconds': ttl,
            })
        stats.sort(key=lambda x: x['count'], reverse=True)
        return jsonify({'anonymousUsers': stats, 'total': len(keys)}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@security_bp.route('/anonymous-usage/<fingerprint>/reset', methods=['POST'])
@require_admin
def reset_anonymous_usage(current_user, fingerprint):
    """Reset a specific anonymous user's free usage counter."""
    try:
        from app.utils.redis_client import get_redis
        r = get_redis()
        if not r:
            return jsonify({'message': 'Redis unavailable'}), 503
        r.delete(f'free:analyze:{fingerprint}')
        return jsonify({'message': 'Usage reset'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ─── Rate Limit Management ───────────────────────────────────────────────────

@security_bp.route('/rate-limits/user/<user_id>/reset', methods=['POST'])
@require_admin
def reset_user_rate_limit(current_user, user_id):
    """Reset rate limit counters for a specific user."""
    try:
        from app.utils.redis_client import get_redis
        r = get_redis()
        if not r:
            return jsonify({'message': 'Redis unavailable'}), 503
        keys = r.keys(f'rl:*:user:{user_id}')
        if keys:
            r.delete(*keys)
        return jsonify({'message': f'Rate limits reset for user {user_id}', 'keysCleared': len(keys)}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@security_bp.route('/rate-limits/stats', methods=['GET'])
@require_admin
def get_rate_limit_stats(current_user):
    """Get current rate limit stats from Redis."""
    try:
        from app.utils.redis_client import get_redis
        r = get_redis()
        if not r:
            return jsonify({'message': 'Redis unavailable'}), 503
        user_keys = r.keys('rl:*:user:*')
        anon_keys = r.keys('rl:*:anon:*')
        apikey_keys = r.keys('rl:apikey:*')
        return jsonify({
            'authenticatedUsers': len(user_keys),
            'anonymousUsers': len(anon_keys),
            'apiKeys': len(apikey_keys),
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ─── Subscription Enforcement ────────────────────────────────────────────────

@security_bp.route('/subscription-enforcement', methods=['GET'])
@require_admin
def get_subscription_enforcement(current_user):
    """Get subscription enforcement settings."""
    try:
        doc = _get_settings_doc().get()
        settings = doc.to_dict() if doc.exists else {}
        return jsonify({
            'enforceSubscriptionLimits': settings.get('enforceSubscriptionLimits', True),
            'gracePeriodDays': settings.get('gracePeriodDays', 3),
            'notifyAtUsagePct': settings.get('notifyAtUsagePct', 80),
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@security_bp.route('/subscription-enforcement', methods=['PUT'])
@require_superadmin
def update_subscription_enforcement(current_user):
    """Update subscription enforcement settings."""
    try:
        data = request.get_json()
        allowed = {'enforceSubscriptionLimits', 'gracePeriodDays', 'notifyAtUsagePct'}
        update = {k: v for k, v in data.items() if k in allowed}
        update['updatedAt'] = datetime.now(timezone.utc)
        _get_settings_doc().set(update, merge=True)
        _invalidate_settings_cache()
        return jsonify({'message': 'Enforcement settings updated', 'updated': update}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ─── Security Audit Log ──────────────────────────────────────────────────────

@security_bp.route('/audit', methods=['GET'])
@require_admin
def get_security_audit(current_user):
    """Get security-specific audit log entries."""
    try:
        from firebase_admin import firestore
        db = _get_db()
        page = int(request.args.get('page', 1))
        per_page = 50

        # Fetch recent audit logs and filter in Python to avoid composite index requirement
        logs_stream = db.collection('audit_logs')\
            .order_by('timestamp', direction=firestore.Query.DESCENDING)\
            .limit(per_page * 5)\
            .stream()

        security_logs = [
            {'id': l.id, **l.to_dict()}
            for l in logs_stream
            if str(l.to_dict().get('action', '')).startswith('security.')
        ][:per_page]

        return jsonify({
            'logs': security_logs,
            'page': page,
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
