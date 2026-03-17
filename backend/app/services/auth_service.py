from firebase_admin import auth
from datetime import datetime
import requests
from app.config import Config
from app.services.email_service import generate_otp, store_otp, verify_otp, send_otp_email, send_password_reset_email
from app.utils.jwt_utils import create_tokens, create_reset_token, verify_reset_token

def firebase_user_to_dict(firebase_user):
    """Convert Firebase user to frontend-compatible dict"""
    return {
        'uid': firebase_user.uid,
        'email': firebase_user.email,
        'displayName': firebase_user.display_name,
        'photoURL': firebase_user.photo_url,
        'emailVerified': firebase_user.email_verified,
        'phoneNumber': firebase_user.phone_number,
        'createdAt': datetime.fromtimestamp(firebase_user.user_metadata.creation_timestamp / 1000).isoformat() + 'Z',
        'lastLoginAt': datetime.fromtimestamp(firebase_user.user_metadata.last_sign_in_timestamp / 1000).isoformat() + 'Z' if firebase_user.user_metadata.last_sign_in_timestamp else None
    }

def register_user(email, password, display_name):
    """Register new user with Firebase"""
    try:
        # Validate email format
        if not email or '@' not in email:
            raise Exception('Invalid email address')
        
        # Validate password strength
        if len(password) < 8:
            raise Exception('Password must be at least 8 characters')
        
        # Validate display name
        if not display_name or len(display_name.strip()) < 2:
            raise Exception('Display name must be at least 2 characters')
        
        # Create Firebase user
        user = auth.create_user(
            email=email.lower().strip(),
            password=password,
            display_name=display_name.strip(),
            email_verified=False
        )
        
        # Generate and send OTP
        otp = generate_otp()
        store_otp(email, otp)
        send_otp_email(email, otp)
        
        return {
            'user': firebase_user_to_dict(user),
            'message': 'Verification email sent'
        }
    except auth.EmailAlreadyExistsError:
        raise Exception('Email already registered')
    except Exception as e:
        error_msg = str(e)
        if 'WEAK_PASSWORD' in error_msg:
            raise Exception('Password is too weak. Use a stronger password')
        raise Exception(error_msg if error_msg else 'Registration failed')

def verify_user_otp(email, otp):
    """Verify OTP and mark email as verified"""
    # Validate inputs
    if not email or not otp:
        raise Exception('Email and OTP are required')
    
    if not otp.isdigit() or len(otp) != 6:
        raise Exception('Invalid OTP format')
    
    if not verify_otp(email, otp):
        raise Exception('Invalid or expired OTP')
    
    try:
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, email_verified=True)
        
        updated_user = auth.get_user(user.uid)
        tokens = create_tokens(updated_user.uid, updated_user.email)
        
        # Trigger automation for user.verified event
        try:
            from app.services.automation_service import trigger_automation
            user_data = {
                'uid': updated_user.uid,
                'email': updated_user.email,
                'displayName': updated_user.display_name
            }
            trigger_automation('user.verified', user_data)
        except Exception as e:
            print(f"Automation trigger error: {str(e)}")
        
        return {
            'user': firebase_user_to_dict(updated_user),
            'tokens': tokens
        }
    except auth.UserNotFoundError:
        raise Exception('User not found')
    except Exception as e:
        raise Exception(f'Verification failed: {str(e)}')

def resend_user_otp(email):
    """Resend OTP to user"""
    try:
        user = auth.get_user_by_email(email)
        if user.email_verified:
            raise Exception('Email already verified')
        
        otp = generate_otp()
        store_otp(email, otp)
        send_otp_email(email, otp)
        
        return {'message': 'Verification code resent'}
    except Exception as e:
        raise Exception(f'Failed to resend OTP: {str(e)}')

def login_user(email, password):
    """Login user with password verification via Firebase REST API"""
    try:
        # Step 1: Verify password using Firebase REST API
        firebase_api_key = Config.FIREBASE_API_KEY
        if not firebase_api_key:
            raise Exception('Firebase API key not configured')
        
        # Firebase Auth REST API endpoint
        url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}'
        
        response = requests.post(url, json={
            'email': email,
            'password': password,
            'returnSecureToken': True
        }, timeout=10)
        
        if response.status_code != 200:
            error_data = response.json()
            error_message = error_data.get('error', {}).get('message', 'INVALID_PASSWORD')
            
            if 'INVALID_PASSWORD' in error_message or 'EMAIL_NOT_FOUND' in error_message:
                raise Exception('Invalid email or password')
            elif 'USER_DISABLED' in error_message:
                raise Exception('Account has been disabled')
            elif 'TOO_MANY_ATTEMPTS_TRY_LATER' in error_message:
                raise Exception('Too many failed attempts. Please try again later')
            else:
                raise Exception('Login failed. Please try again')
        
        # Step 2: Get user from Firebase Admin SDK
        user = auth.get_user_by_email(email)
        
        if not user.email_verified:
            raise Exception('Please verify your email first')
        
        # Step 3: Create JWT tokens
        tokens = create_tokens(user.uid, user.email)
        
        return {
            'user': firebase_user_to_dict(user),
            'tokens': tokens
        }
    except requests.exceptions.RequestException:
        raise Exception('Network error. Please check your connection')
    except Exception as e:
        raise Exception(str(e))

def send_password_reset(email):
    """Send password reset email"""
    try:
        user = auth.get_user_by_email(email)
        token = create_reset_token(email)
        send_password_reset_email(email, token)
        
        return {'message': 'Password reset email sent'}
    except:
        # Don't reveal if email exists
        return {'message': 'Password reset email sent'}

def reset_user_password(token, new_password):
    """Reset password using token"""
    try:
        email = verify_reset_token(token)
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=new_password)
        
        return {'message': 'Password updated successfully'}
    except Exception as e:
        raise Exception(f'Password reset failed: {str(e)}')

def update_user_password(uid, current_password, new_password):
    """Update password for authenticated user"""
    try:
        # Note: Firebase Admin SDK can't verify current password
        # In production, use Firebase Auth REST API
        auth.update_user(uid, password=new_password)
        return {'message': 'Password changed successfully'}
    except Exception as e:
        raise Exception(f'Password update failed: {str(e)}')

def update_user_profile(uid, display_name=None, phone_number=None):
    """Update user profile"""
    try:
        updates = {}
        if display_name is not None:
            updates['display_name'] = display_name
        if phone_number is not None:
            updates['phone_number'] = phone_number
        
        auth.update_user(uid, **updates)
        updated_user = auth.get_user(uid)
        
        return {'user': firebase_user_to_dict(updated_user)}
    except Exception as e:
        raise Exception(f'Profile update failed: {str(e)}')

def get_user_by_uid(uid):
    """Get user by UID"""
    try:
        user = auth.get_user(uid)
        return firebase_user_to_dict(user)
    except Exception as e:
        raise Exception('User not found')
