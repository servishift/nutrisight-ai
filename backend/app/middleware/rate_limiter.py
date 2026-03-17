"""
Rate Limiting Middleware for Production
"""

from functools import wraps
from flask import request, jsonify
from time import time
from collections import defaultdict
import threading

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Check if request is within rate limit"""
        now = time()
        with self.lock:
            # Clean old requests
            self.requests[key] = [req_time for req_time in self.requests[key] 
                                  if now - req_time < window]
            
            if len(self.requests[key]) < limit:
                self.requests[key].append(now)
                return True
            return False

rate_limiter = RateLimiter()

def rate_limit(limit=100, window=60):
    """
    Rate limit decorator
    limit: max requests
    window: time window in seconds
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Use IP address as key
            key = request.remote_addr
            
            if not rate_limiter.is_allowed(key, limit, window):
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'limit': limit,
                    'window': window
                }), 429
            
            return f(*args, **kwargs)
        return wrapped
    return decorator
