"""
Request tracking middleware
"""

from flask import request, g
from functools import wraps
import time

def track_request(f):
    """Decorator to track request metrics"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        g.start_time = time.time()
        
        try:
            response = f(*args, **kwargs)
            
            # Track successful request
            latency_ms = (time.time() - g.start_time) * 1000
            status_code = response[1] if isinstance(response, tuple) else 200
            
            from app.services.usage_tracker import usage_tracker
            usage_tracker.track_request(
                endpoint=request.path,
                latency_ms=latency_ms,
                status_code=status_code
            )
            
            return response
            
        except Exception as e:
            # Track failed request
            latency_ms = (time.time() - g.start_time) * 1000
            
            from app.services.usage_tracker import usage_tracker
            usage_tracker.track_request(
                endpoint=request.path,
                latency_ms=latency_ms,
                status_code=500
            )
            
            raise e
    
    return decorated_function
