"""
Marketing Automation Service
Handles automatic triggers for emails, coupons, and campaigns
"""
from firebase_admin import firestore
from datetime import datetime, timezone
from app.services.email_service import send_campaign_email

def get_db():
    return firestore.client()

def get_active_automation_rules(event_type):
    """Get all active automation rules for an event"""
    try:
        db = get_db()
        rules = db.collection('automation_rules')\
            .where('eventType', '==', event_type)\
            .where('active', '==', True)\
            .stream()
        return [{'id': r.id, **r.to_dict()} for r in rules]
    except:
        return []

def trigger_automation(event_type, user_data):
    """
    Trigger automation rules for an event
    
    Events:
    - user.registered: When user signs up
    - user.verified: When user verifies email
    - user.first_analysis: When user does first analysis
    - subscription.created: When user subscribes
    """
    try:
        rules = get_active_automation_rules(event_type)
        
        for rule in rules:
            action_type = rule.get('actionType')
            
            if action_type == 'send_email':
                _send_automation_email(rule, user_data)
            elif action_type == 'assign_coupon':
                _assign_automation_coupon(rule, user_data)
            elif action_type == 'add_to_segment':
                _add_to_segment(rule, user_data)
    except Exception as e:
        print(f"Automation trigger error: {str(e)}")

def _send_automation_email(rule, user_data):
    """Send email based on automation rule"""
    try:
        template_id = rule.get('emailTemplateId')
        if not template_id:
            return
        
        db = get_db()
        template_doc = db.collection('email_templates').document(template_id).get()
        
        if not template_doc.exists:
            return
        
        template = template_doc.to_dict()
        if not template.get('active'):
            return
        
        # Replace variables
        subject = template['subject']
        body = template['body']\
            .replace('{{name}}', user_data.get('displayName', 'there'))\
            .replace('{{email}}', user_data.get('email', ''))
        
        send_campaign_email(user_data['email'], subject, body)
        
        # Log automation execution
        db.collection('automation_logs').add({
            'ruleId': rule['id'],
            'ruleName': rule.get('name'),
            'eventType': rule.get('eventType'),
            'actionType': 'send_email',
            'userId': user_data.get('uid'),
            'userEmail': user_data.get('email'),
            'status': 'success',
            'executedAt': datetime.now(timezone.utc)
        })
    except Exception as e:
        print(f"Email automation error: {str(e)}")

def _assign_automation_coupon(rule, user_data):
    """Assign coupon to user based on automation rule"""
    try:
        coupon_code = rule.get('couponCode')
        if not coupon_code:
            return
        
        db = get_db()
        
        # Check if coupon exists
        coupons = db.collection('coupons')\
            .where('code', '==', coupon_code)\
            .where('active', '==', True)\
            .limit(1)\
            .stream()
        
        coupon = next(coupons, None)
        if not coupon:
            return
        
        # Assign coupon to user
        db.collection('user_coupons').add({
            'userId': user_data.get('uid'),
            'userEmail': user_data.get('email'),
            'couponCode': coupon_code,
            'assignedBy': 'automation',
            'assignedAt': datetime.now(timezone.utc),
            'used': False
        })
        
        # Log automation execution
        db.collection('automation_logs').add({
            'ruleId': rule['id'],
            'ruleName': rule.get('name'),
            'eventType': rule.get('eventType'),
            'actionType': 'assign_coupon',
            'userId': user_data.get('uid'),
            'userEmail': user_data.get('email'),
            'couponCode': coupon_code,
            'status': 'success',
            'executedAt': datetime.now(timezone.utc)
        })
    except Exception as e:
        print(f"Coupon automation error: {str(e)}")

def _add_to_segment(rule, user_data):
    """Add user to segment"""
    try:
        segment_name = rule.get('segmentName')
        if not segment_name:
            return
        
        db = get_db()
        db.collection('user_segments').add({
            'userId': user_data.get('uid'),
            'userEmail': user_data.get('email'),
            'segmentName': segment_name,
            'addedBy': 'automation',
            'addedAt': datetime.now(timezone.utc)
        })
    except Exception as e:
        print(f"Segment automation error: {str(e)}")
