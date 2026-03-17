"""
Request tracking middleware
"""

from flask import request, g
from functools import wraps
import time

def track_request(f):
    """Decorator to track request metrics — never blocks the route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        g.start_time = time.time()
        response = f(*args, **kwargs)
        try:
            latency_ms = (time.time() - g.start_time) * 1000
            status_code = response[1] if isinstance(response, tuple) else 200
            from app.services.usage_tracker import usage_tracker
            usage_tracker.track_request(
                endpoint=request.path,
                latency_ms=latency_ms,
                status_code=status_code
            )
        except Exception:
            pass
        return response
    return decorated_function
