"""
Redis client — shared singleton with graceful fallback.
Retries connection every 30 s after failure; never permanently fails open.
"""
import os
import time
import redis

_redis_client = None
_last_failure: float = 0.0
_RETRY_INTERVAL = 30  # seconds between reconnect attempts


def get_redis():
    global _redis_client, _last_failure

    # Validate existing client is still alive
    if _redis_client is not None:
        try:
            _redis_client.ping()
            return _redis_client
        except Exception:
            _redis_client = None
            _last_failure = time.monotonic()

    # Back-off: don't hammer Redis after a failure
    if time.monotonic() - _last_failure < _RETRY_INTERVAL:
        return None

    try:
        url = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
        client = redis.Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
            retry_on_timeout=False,
        )
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception:
        _last_failure = time.monotonic()
        return None
