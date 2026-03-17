"""
Production Webhook Service with Security & Retry Logic
"""
import hmac
import hashlib
import json
import time
from datetime import datetime
from typing import Dict, List, Optional
import requests
from firebase_admin import firestore
import firebase_admin

class WebhookService:
    def __init__(self):
        self.secret_key = "nutrisight_webhook_secret_2024"  # Move to env in production
        self.max_retries = 3
        self.timeout = 10
    
    def _get_db(self):
        """Lazy Firestore initialization"""
        try:
            return firestore.client()
        except ValueError:
            # Firebase not initialized
            return None
    
    def create_webhook(self, user_id: str, url: str, events: List[str], name: str = None) -> Dict:
        """Create new webhook endpoint"""
        db = self._get_db()
        if not db:
            raise Exception('Firebase not initialized')
        
        # Validate URL
        if not url.startswith('https://'):
            raise ValueError('Webhook URL must use HTTPS')
        
        webhook_data = {
            'userId': user_id,
            'url': url,
            'events': events,
            'name': name or 'Webhook',
            'status': 'active',
            'secret': self._generate_secret(),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'lastTriggered': None,
            'successCount': 0,
            'failureCount': 0
        }
        
        doc_ref = db.collection('webhooks').add(webhook_data)
        webhook_id = doc_ref[1].id
        
        # Return serializable data
        return {
            'id': webhook_id,
            'userId': user_id,
            'url': url,
            'events': events,
            'name': name or 'Webhook',
            'status': 'active',
            'successCount': 0,
            'failureCount': 0
        }
    
    def get_user_webhooks(self, user_id: str) -> List[Dict]:
        """Get all webhooks for a user"""
        db = self._get_db()
        if not db:
            return []
        
        webhooks = db.collection('webhooks')\
            .where('userId', '==', user_id)\
            .where('status', '==', 'active')\
            .stream()
        
        return [{'id': w.id, **w.to_dict()} for w in webhooks]
    
    def trigger_event(self, event_type: str, data: Dict, user_id: str = None):
        """Trigger webhooks for an event"""
        db = self._get_db()
        if not db:
            return
        
        # Get matching webhooks
        query = db.collection('webhooks')\
            .where('status', '==', 'active')\
            .where('events', 'array_contains', event_type)
        
        if user_id:
            query = query.where('userId', '==', user_id)
        
        webhooks = query.stream()
        
        for webhook_doc in webhooks:
            webhook = webhook_doc.to_dict()
            webhook['id'] = webhook_doc.id
            self._send_webhook(webhook, event_type, data)
    
    def _send_webhook(self, webhook: Dict, event_type: str, data: Dict):
        """Send webhook with retry logic"""
        payload = {
            'event': event_type,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'webhookId': webhook['id'],
            'data': data
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': self._generate_signature(payload, webhook['secret']),
            'X-Webhook-Event': event_type,
            'User-Agent': 'NutriSight-Webhook/1.0'
        }
        
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    webhook['url'],
                    json=payload,
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    self._log_success(webhook['id'])
                    return
                else:
                    self._log_failure(webhook['id'], f'HTTP {response.status_code}')
            
            except Exception as e:
                self._log_failure(webhook['id'], str(e))
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
    
    def _generate_signature(self, payload: Dict, secret: str) -> str:
        """Generate HMAC signature for webhook security"""
        message = json.dumps(payload, sort_keys=True).encode()
        signature = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
        return f'sha256={signature}'
    
    def _generate_secret(self) -> str:
        """Generate unique secret for webhook"""
        import secrets
        return secrets.token_urlsafe(32)
    
    def _log_success(self, webhook_id: str):
        """Log successful webhook delivery"""
        db = self._get_db()
        if not db:
            return
        
        db.collection('webhooks').document(webhook_id).update({
            'lastTriggered': firestore.SERVER_TIMESTAMP,
            'successCount': firestore.Increment(1)
        })
        
        db.collection('webhook_logs').add({
            'webhookId': webhook_id,
            'status': 'success',
            'timestamp': firestore.SERVER_TIMESTAMP
        })
    
    def _log_failure(self, webhook_id: str, error: str):
        """Log failed webhook delivery"""
        db = self._get_db()
        if not db:
            return
        
        db.collection('webhooks').document(webhook_id).update({
            'failureCount': firestore.Increment(1)
        })
        
        db.collection('webhook_logs').add({
            'webhookId': webhook_id,
            'status': 'failed',
            'error': error,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
    
    def delete_webhook(self, webhook_id: str, user_id: str) -> bool:
        """Delete webhook (soft delete)"""
        db = self._get_db()
        if not db:
            return False
        
        webhook_ref = db.collection('webhooks').document(webhook_id)
        webhook = webhook_ref.get()
        
        if not webhook.exists or webhook.to_dict().get('userId') != user_id:
            return False
        
        webhook_ref.update({'status': 'deleted'})
        return True
    
    def get_webhook_logs(self, webhook_id: str, limit: int = 50) -> List[Dict]:
        """Get webhook delivery logs"""
        db = self._get_db()
        if not db:
            return []
        
        logs = db.collection('webhook_logs')\
            .where('webhookId', '==', webhook_id)\
            .limit(limit)\
            .stream()
        
        result = [{'id': log.id, **log.to_dict()} for log in logs]
        # Sort in Python instead of Firestore
        result.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return result

# Singleton instance
webhook_service = WebhookService()
