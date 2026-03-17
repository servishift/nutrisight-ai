from firebase_admin import auth
from app.utils.jwt_utils import create_tokens
from app.services.auth_service import firebase_user_to_dict

def handle_google_oauth_callback(id_token):
    """
    Handle Google OAuth callback with Firebase ID token
    """
    try:
        # Verify the Google ID token with Firebase
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Get or create user
        try:
            user = auth.get_user(uid)
        except:
            # User doesn't exist, create from token
            user = auth.create_user(
                uid=uid,
                email=decoded_token.get('email'),
                display_name=decoded_token.get('name'),
                photo_url=decoded_token.get('picture'),
                email_verified=decoded_token.get('email_verified', False)
            )
        
        # Mark email as verified for OAuth users
        if not user.email_verified:
            auth.update_user(uid, email_verified=True)
            user = auth.get_user(uid)
        
        # Generate JWT tokens
        tokens = create_tokens(user.uid, user.email)
        
        return {
            'user': firebase_user_to_dict(user),
            'tokens': tokens
        }
    except Exception as e:
        raise Exception(f'OAuth authentication failed: {str(e)}')

def get_google_oauth_url():
    """
    Generate Google OAuth URL for client-side redirect
    This is handled by Firebase on the frontend
    """
    return {
        'message': 'Use Firebase client SDK for OAuth',
        'provider': 'google'
    }
