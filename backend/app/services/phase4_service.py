"""
Phase 4 Service: API Keys, Usage Analytics, Webhooks
Production-grade API management system
"""

import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

def get_db():
    """Lazy load Firestore client"""
    from firebase_admin import firestore
    return firestore.client()

class Phase4Service:
    
    # ============================================================================
    # API KEY MANAGEMENT
    # ============================================================================
    
    def create_api_key(self, user_id: str, name: str, tier: str = 'free') -> Dict[str, Any]:
        """Create new API key"""
        db = get_db()
        # Generate secure API key
        key = f"fiai_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        # Rate limits by tier
        limits = {
            'free': {'requests_per_day': 100, 'requests_per_minute': 10},
            'pro': {'requests_per_day': 10000, 'requests_per_minute': 100},
            'enterprise': {'requests_per_day': -1, 'requests_per_minute': -1}
        }
        
        api_key_data = {
            'user_id': user_id,
            'name': name,
            'key_hash': key_hash,
            'key_prefix': key[:12],
            'tier': tier,
            'limits': limits.get(tier, limits['free']),
            'created_at': datetime.now(timezone.utc),
            'last_used': None,
            'is_active': True,
            'usage_count': 0
        }
        
        # Save to Firestore
        doc_ref = db.collection('api_keys').document()
        api_key_data['id'] = doc_ref.id
        doc_ref.set(api_key_data)
        
        return {
            'id': doc_ref.id,
            'key': key,  # Only returned once
            'name': name,
            'environment': 'live',  # Default to live for now
            'isActive': True,
            'requestCount': 0,
            'createdAt': api_key_data['created_at'].isoformat()
        }
    
    def list_api_keys(self, user_id: str) -> List[Dict[str, Any]]:
        """List user's API keys"""
        db = get_db()
        keys = db.collection('api_keys').where('user_id', '==', user_id).stream()
        
        result = []
        for key in keys:
            data = key.to_dict()
            # Extract environment from key_prefix (e.g., "fiai_" -> "live")
            environment = "live" if data.get('key_prefix', '').startswith('fiai_') else "test"
            
            result.append({
                'id': data['id'],
                'name': data['name'],
                'key': data['key_prefix'] + '****' + data['key_prefix'][-4:] if data.get('key_prefix') else 'fiai_****',
                'environment': environment,
                'isActive': data['is_active'],
                'requestCount': data['usage_count'],
                'lastUsedAt': data['last_used'].isoformat() if data['last_used'] else None,
                'createdAt': data['created_at'].isoformat()
            })
        
        return result
    
    def revoke_api_key(self, key_id: str, user_id: str) -> bool:
        """Revoke API key - sets is_active to False"""
        db = get_db()
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists or doc.to_dict()['user_id'] != user_id:
            return False
        
        # Set is_active to False instead of deleting
        doc_ref.update({
            'is_active': False,
            'revoked_at': datetime.now(timezone.utc)
        })
        return True
    
    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key and return key data"""
        db = get_db()
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        keys = db.collection('api_keys').where('key_hash', '==', key_hash).where('is_active', '==', True).limit(1).stream()
        
        for key in keys:
            data = key.to_dict()
            
            # Check rate limits
            if not self._check_rate_limit(data):
                return None
            
            # Update usage
            db.collection('api_keys').document(data['id']).update({
                'last_used': datetime.now(timezone.utc),
                'usage_count': firestore.Increment(1)
            })
            
            return data
        
        return None
    
    def _check_rate_limit(self, key_data: Dict) -> bool:
        """Check if API key is within rate limits"""
        db = get_db()
        limits = key_data['limits']
        
        # Unlimited for enterprise
        if limits['requests_per_day'] == -1:
            return True
        
        # Check daily limit
        today = datetime.now(timezone.utc).date()
        usage_today = db.collection('api_usage').where('key_id', '==', key_data['id']).where('date', '==', today).stream()
        
        count = sum(1 for _ in usage_today)
        if count >= limits['requests_per_day']:
            return False
        
        return True
    
    # ============================================================================
    # USAGE ANALYTICS
    # ============================================================================
    
    def log_api_usage(self, key_id: str, endpoint: str, status: int, response_time: float):
        """Log API usage"""
        db = get_db()
        usage_data = {
            'key_id': key_id,
            'endpoint': endpoint,
            'status': status,
            'response_time_ms': response_time,
            'timestamp': datetime.now(timezone.utc),
            'date': datetime.now(timezone.utc).date()
        }
        
        db.collection('api_usage').add(usage_data)
    
    def get_usage_analytics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get usage analytics for user"""
        db = get_db()
        # Get user's API keys
        keys = db.collection('api_keys').where('user_id', '==', user_id).stream()
        key_ids = [k.to_dict()['id'] for k in keys]
        
        if not key_ids:
            return {'total_requests': 0, 'by_endpoint': {}, 'by_date': {}, 'avg_response_time': 0}
        
        # Get usage data
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        usage_data = []
        
        for key_id in key_ids:
            usage = db.collection('api_usage').where('key_id', '==', key_id).where('timestamp', '>=', start_date).stream()
            usage_data.extend([u.to_dict() for u in usage])
        
        # Aggregate data
        total_requests = len(usage_data)
        by_endpoint = {}
        by_date = {}
        total_response_time = 0
        
        for usage in usage_data:
            endpoint = usage['endpoint']
            date = usage['date'].isoformat()
            
            by_endpoint[endpoint] = by_endpoint.get(endpoint, 0) + 1
            by_date[date] = by_date.get(date, 0) + 1
            total_response_time += usage['response_time_ms']
        
        return {
            'total_requests': total_requests,
            'by_endpoint': by_endpoint,
            'by_date': by_date,
            'avg_response_time': total_response_time / total_requests if total_requests > 0 else 0
        }
    
    # ============================================================================
    # WEBHOOKS
    # ============================================================================
    
    def create_webhook(self, user_id: str, url: str, events: List[str], secret: str = None) -> Dict[str, Any]:
        """Create webhook"""
        db = get_db()
        if not secret:
            secret = secrets.token_urlsafe(32)
        
        webhook_data = {
            'user_id': user_id,
            'url': url,
            'events': events,
            'secret': secret,
            'is_active': True,
            'created_at': datetime.now(timezone.utc),
            'last_triggered': None,
            'success_count': 0,
            'failure_count': 0
        }
        
        doc_ref = db.collection('webhooks').document()
        webhook_data['id'] = doc_ref.id
        doc_ref.set(webhook_data)
        
        return {
            'id': doc_ref.id,
            'url': url,
            'events': events,
            'secret': secret,
            'created_at': webhook_data['created_at'].isoformat()
        }
    
    def list_webhooks(self, user_id: str) -> List[Dict[str, Any]]:
        """List user's webhooks"""
        db = get_db()
        webhooks = db.collection('webhooks').where('user_id', '==', user_id).stream()
        
        result = []
        for webhook in webhooks:
            data = webhook.to_dict()
            result.append({
                'id': data['id'],
                'url': data['url'],
                'events': data['events'],
                'is_active': data['is_active'],
                'success_count': data['success_count'],
                'failure_count': data['failure_count'],
                'last_triggered': data['last_triggered'].isoformat() if data['last_triggered'] else None,
                'created_at': data['created_at'].isoformat()
            })
        
        return result
    
    def delete_webhook(self, webhook_id: str, user_id: str) -> bool:
        """Delete webhook"""
        db = get_db()
        doc_ref = db.collection('webhooks').document(webhook_id)
        doc = doc_ref.get()
        
        if not doc.exists or doc.to_dict()['user_id'] != user_id:
            return False
        
        doc_ref.delete()
        return True
    
    def trigger_webhook(self, user_id: str, event: str, payload: Dict):
        """Trigger webhooks for event"""
        import requests
        import hmac
        from firebase_admin import firestore
        db = get_db()
        
        webhooks = db.collection('webhooks').where('user_id', '==', user_id).where('is_active', '==', True).stream()
        
        for webhook in webhooks:
            data = webhook.to_dict()
            
            if event not in data['events']:
                continue
            
            # Create signature
            signature = hmac.new(
                data['secret'].encode(),
                str(payload).encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Send webhook
            try:
                response = requests.post(
                    data['url'],
                    json=payload,
                    headers={'X-Webhook-Signature': signature},
                    timeout=5
                )
                
                success = response.status_code == 200
                
                db.collection('webhooks').document(data['id']).update({
                    'last_triggered': datetime.now(timezone.utc),
                    'success_count': firestore.Increment(1) if success else data['success_count'],
                    'failure_count': firestore.Increment(1) if not success else data['failure_count']
                })
            except:
                db.collection('webhooks').document(data['id']).update({
                    'failure_count': firestore.Increment(1)
                })

phase4_service = Phase4Service()
