"""
Admin authentication middleware
Verifies JWT token and checks for admin/superadmin role
"""
from functools import wraps
from flask import request, jsonify
from firebase_admin import auth
from app.utils.jwt_utils import verify_token

def require_admin(f):
    """Decorator to protect admin routes - requires admin or superadmin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify JWT token
            payload = verify_token(token)
            
            # Get user from Firebase to check custom claims
            user = auth.get_user(payload['uid'])
            
            # Check if user has admin role in custom claims
            custom_claims = user.custom_claims or {}
            role = custom_claims.get('role')
            
            if role not in ['admin', 'superadmin']:
                return jsonify({'message': 'Admin access required'}), 403
            
            # Create admin info dict
            current_user = {
                'uid': user.uid,
                'email': user.email,
                'role': role,
                'displayName': user.display_name
            }
            
            # Pass current_user as parameter to the function
            return f(current_user, *args, **kwargs)
            
        except Exception as e:
            return jsonify({'message': f'Authentication failed: {str(e)}'}), 401
    
    return decorated_function

def require_superadmin(f):
    """Decorator for superadmin-only routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = verify_token(token)
            user = auth.get_user(payload['uid'])
            custom_claims = user.custom_claims or {}
            role = custom_claims.get('role')
            
            if role != 'superadmin':
                return jsonify({'message': 'Superadmin access required'}), 403
            
            current_user = {
                'uid': user.uid,
                'email': user.email,
                'role': role,
                'displayName': user.display_name
            }
            
            return f(current_user, *args, **kwargs)
            
        except Exception as e:
            return jsonify({'message': f'Authentication failed: {str(e)}'}), 401
    
    return decorated_function
