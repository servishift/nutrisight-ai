"""
API Key Tier Sync Service
Updates API key tiers based on user subscriptions
"""
from firebase_admin import firestore
from datetime import datetime, timezone

def sync_api_key_tier(user_id):
    """Sync API key tier for a specific user based on their subscriptions"""
    try:
        db = firestore.client()
        
        # Determine tier based on user subscriptions
        new_tier = 'free'  # Default
        
        # Check platform subscriptions
        platform_subs = db.collection('subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .stream()
        
        for sub in platform_subs:
            sub_data = sub.to_dict()
            plan_id = sub_data.get('planId')
            if plan_id == 'enterprise':
                new_tier = 'enterprise'
                break
            elif plan_id == 'pro':
                new_tier = 'pro'
        
        # Check API subscriptions (higher priority)
        api_subs = db.collection('api_subscriptions')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .stream()
        
        for sub in api_subs:
            sub_data = sub.to_dict()
            plan_id = sub_data.get('planId')
            if plan_id == 'professional':
                new_tier = 'enterprise'
                break
            elif plan_id == 'starter':
                new_tier = 'pro'
        
        # Update all API keys for this user
        api_keys = db.collection('api_keys')\
            .where('user_id', '==', user_id)\
            .stream()
        
        updated_count = 0
        for key_doc in api_keys:
            key_data = key_doc.to_dict()
            current_tier = key_data.get('tier', 'free')
            
            if current_tier != new_tier:
                db.collection('api_keys').document(key_doc.id).update({
                    'tier': new_tier,
                    'tierUpdatedAt': datetime.now(timezone.utc)
                })
                updated_count += 1
        
        return {'success': True, 'tier': new_tier, 'updated_keys': updated_count}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def sync_all_api_key_tiers():
    """Sync all API key tiers with user subscriptions"""
    try:
        db = firestore.client()
        
        # Get all API keys
        api_keys = list(db.collection('api_keys').stream())
        updated_count = 0
        
        for key_doc in api_keys:
            key_data = key_doc.to_dict()
            user_id = key_data['user_id']
            result = sync_api_key_tier(user_id)
            if result['success'] and result['updated_keys'] > 0:
                updated_count += result['updated_keys']
        
        return {'success': True, 'total_keys': len(api_keys), 'updated_keys': updated_count}
    except Exception as e:
        return {'success': False, 'error': str(e)}