from functools import wraps
from flask import request, jsonify
from app.utils.jwt_utils import verify_token

def require_auth(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header:
            return jsonify({'message': 'Authorization header missing'}), 401

        if not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Invalid authorization scheme'}), 401

        token = auth_header[7:].strip()
        if not token:
            return jsonify({'message': 'Empty bearer token'}), 401

        try:
            payload = verify_token(token)
            request.user = payload
            request.user_id = payload.get('uid')
            return f(current_user=payload, *args, **kwargs)
        except Exception as e:
            return jsonify({'message': str(e)}), 401

    return decorated
