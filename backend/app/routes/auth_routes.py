from flask import Blueprint, request, jsonify
from app.services import auth_service
from app.utils.jwt_utils import refresh_access_token, invalidate_refresh_token
from app.middleware.auth_middleware import require_auth
from app.middleware.security import _redis_rate_check, _get_real_ip

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _auth_rate_limit(key_suffix: str, limit: int, window: int):
    """Per-IP rate limit for sensitive auth endpoints. Returns 429 response or None."""
    ip = _get_real_ip()
    key = f"rl:auth:{key_suffix}:{ip}"
    allowed, _ = _redis_rate_check(key, limit, window)
    if not allowed:
        return jsonify({'message': 'Too many attempts. Please try again later.'}), 429
    return None


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user — 10 attempts per IP per hour"""
    if (resp := _auth_rate_limit('register', 10, 3600)):
        return resp
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        display_name = data.get('displayName')

        if not email or not password or not display_name:
            return jsonify({'message': 'Missing required fields'}), 400

        result = auth_service.register_user(email, password, display_name)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP — 10 attempts per IP per 15 minutes (brute-force protection)"""
    if (resp := _auth_rate_limit('verify-otp', 10, 900)):
        return resp
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')

        if not email or not otp:
            return jsonify({'message': 'Email and OTP required'}), 400

        result = auth_service.verify_user_otp(email, otp)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP — 5 attempts per IP per hour"""
    if (resp := _auth_rate_limit('resend-otp', 5, 3600)):
        return resp
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email required'}), 400

        result = auth_service.resend_user_otp(email)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login — 20 attempts per IP per 15 minutes (brute-force protection)"""
    if (resp := _auth_rate_limit('login', 20, 900)):
        return resp
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email and password required'}), 400

        result = auth_service.login_user(email, password)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 401


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Forgot password — 5 attempts per IP per hour"""
    if (resp := _auth_rate_limit('forgot-password', 5, 3600)):
        return resp
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email required'}), 400

        result = auth_service.send_password_reset(email)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('newPassword')
        
        if not token or not new_password:
            return jsonify({'message': 'Token and new password required'}), 400
        
        result = auth_service.reset_user_password(token, new_password)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@auth_bp.route('/update-password', methods=['POST'])
@require_auth
def update_password():
    """Update password for authenticated user"""
    try:
        data = request.get_json()
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'message': 'Current and new password required'}), 400
        
        result = auth_service.update_user_password(
            request.user['uid'],
            current_password,
            new_password
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@auth_bp.route('/update-profile', methods=['POST'])
@require_auth
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        display_name = data.get('displayName')
        phone_number = data.get('phoneNumber')
        
        result = auth_service.update_user_profile(
            request.user['uid'],
            display_name=display_name,
            phone_number=phone_number
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token"""
    try:
        data = request.get_json()
        refresh_token = data.get('refreshToken')
        
        if not refresh_token:
            return jsonify({'message': 'Refresh token required'}), 400
        
        tokens = refresh_access_token(refresh_token)
        return jsonify(tokens), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 401

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user"""
    try:
        # Optionally get refresh token from body to invalidate
        data = request.get_json() or {}
        refresh_token = data.get('refreshToken')
        
        if refresh_token:
            invalidate_refresh_token(refresh_token)
        
        return jsonify({'message': 'Logged out'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current authenticated user"""
    try:
        user = auth_service.get_user_by_uid(request.user['uid'])
        return jsonify({'user': user}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 404

@auth_bp.route('/oauth', methods=['POST'])
def oauth():
    """OAuth login with Firebase ID token"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        id_token = data.get('idToken')
        
        if provider != 'google':
            return jsonify({'message': 'Only Google OAuth is supported'}), 400
        
        if not id_token:
            return jsonify({'message': 'ID token required'}), 400
        
        from app.services.oauth_service import handle_google_oauth_callback
        result = handle_google_oauth_callback(id_token)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400
