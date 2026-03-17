"""
Admin panel routes
All routes require admin authentication
"""
from flask import Blueprint, request, jsonify
from app.middleware.admin_middleware import require_admin, require_superadmin
from app.middleware.auth_middleware import require_auth
from app.services import admin_service
from datetime import datetime, timezone

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ─── Authentication ─────────────────────────────────────

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email and password required'}), 400
        
        result = admin_service.admin_login(email, password)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 401

# ─── Dashboard ──────────────────────────────────────────

@admin_bp.route('/dashboard', methods=['GET'])
@require_admin
def get_dashboard(current_user):
    """Get dashboard statistics"""
    try:
        stats = admin_service.get_dashboard_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── User Management ────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@require_admin
def get_users(current_user):
    """Get paginated user list with filters"""
    try:
        page = int(request.args.get('page', 1))
        search = request.args.get('search')
        role = request.args.get('role')
        
        result = admin_service.get_users_paginated(page, search, role)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@require_admin
def create_user(current_user):
    """Create new user"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password required'}), 400
        
        user = admin_service.create_user(data, current_user['uid'], current_user['email'])
        return jsonify(user), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_admin
def get_user(current_user, user_id):
    """Get single user details"""
    try:
        user = admin_service.get_user_by_id(user_id)
        return jsonify(user), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 404

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@require_admin
def update_user(current_user, user_id):
    """Update user details"""
    try:
        data = request.get_json()
        
        user = admin_service.update_user(user_id, data, current_user['uid'], current_user['email'])
        return jsonify(user), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/users/<user_id>/toggle-status', methods=['POST'])
@require_admin
def toggle_user_status(current_user, user_id):
    """Toggle user active/inactive status"""
    try:
        user = admin_service.toggle_user_status(user_id, current_user['uid'], current_user['email'])
        return jsonify(user), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@require_superadmin
def delete_user(current_user, user_id):
    """Delete user permanently (superadmin only)"""
    try:
        result = admin_service.delete_user(user_id, current_user['uid'], current_user['email'])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

# ─── Additive Management ────────────────────────────────

@admin_bp.route('/additives', methods=['GET'])
@require_admin
def get_additives(current_user):
    """Get paginated additive list with filters"""
    try:
        page = int(request.args.get('page', 1))
        search = request.args.get('search')
        category = request.args.get('category')
        
        result = admin_service.get_additives_paginated(page, search, category)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/additives', methods=['POST'])
@require_admin
def create_additive(current_user):
    """Create new additive"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['code', 'name', 'category', 'riskLevel']
        if not all(k in data for k in required):
            return jsonify({'message': 'Missing required fields'}), 400
        
        additive = admin_service.create_additive(data, current_user['uid'], current_user['email'])
        return jsonify(additive), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/additives/<additive_id>', methods=['PUT'])
@require_admin
def update_additive(current_user, additive_id):
    """Update additive"""
    try:
        data = request.get_json()
        
        additive = admin_service.update_additive(additive_id, data, current_user['uid'], current_user['email'])
        return jsonify(additive), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/additives/<additive_id>', methods=['DELETE'])
@require_admin
def delete_additive(current_user, additive_id):
    """Delete additive"""
    try:
        result = admin_service.delete_additive(additive_id, current_user['uid'], current_user['email'])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

# ─── Analytics ──────────────────────────────────────────

@admin_bp.route('/analytics', methods=['GET'])
@require_admin
def get_analytics(current_user):
    """Get analytics data"""
    try:
        range_param = request.args.get('range', '7d')
        
        if range_param not in ['7d', '30d', '90d', '1y']:
            return jsonify({'message': 'Invalid range parameter'}), 400
        
        data = admin_service.get_analytics(range_param)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/analytics/model-performance', methods=['GET'])
@require_admin
def get_model_performance(current_user):
    """Get ML model performance metrics"""
    try:
        metrics = admin_service.get_model_performance()
        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/analytics/top-additives', methods=['GET'])
@require_admin
def get_top_additives(current_user):
    """Get most detected additives"""
    try:
        data = admin_service.get_top_additives()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── Audit Logs ─────────────────────────────────────────

@admin_bp.route('/audit-logs', methods=['GET'])
@require_admin
def get_audit_logs(current_user):
    """Get audit logs"""
    try:
        page = int(request.args.get('page', 1))
        result = admin_service.get_audit_logs(page)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── Settings ───────────────────────────────────────────

@admin_bp.route('/settings', methods=['GET'])
@require_admin
def get_settings(current_user):
    """Get platform settings"""
    try:
        settings = admin_service.get_settings()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/settings', methods=['PUT'])
@require_superadmin
def update_settings(current_user):
    """Update platform settings (superadmin only)"""
    try:
        data = request.get_json()
        settings = admin_service.update_settings(data, current_user['uid'], current_user['email'])
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── Public Settings ────────────────────────────────────

@admin_bp.route('/settings/public', methods=['GET'])
def get_public_settings():
    """Get public settings (no auth required)"""
    try:
        settings = admin_service.get_settings()
        return jsonify({
            'maintenanceMode': settings.get('maintenanceMode', False),
            'registrationOpen': settings.get('registrationOpen', True),
            'freeAnalysisLimit': settings.get('freeAnalysisLimit', 10)
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── Marketing & Promotions ─────────────────────────────

@admin_bp.route('/marketing/coupons', methods=['GET'])
@require_admin
def get_coupons(current_user):
    """Get coupons list"""
    try:
        page = int(request.args.get('page', 1))
        result = admin_service.get_coupons(page)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/marketing/coupons', methods=['POST'])
@require_admin
def create_coupon(current_user):
    """Create new coupon"""
    try:
        data = request.get_json()
        
        if not data.get('code') or not data.get('discount'):
            return jsonify({'message': 'Code and discount required'}), 400
        
        coupon = admin_service.create_coupon(data, current_user['uid'], current_user['email'])
        return jsonify(coupon), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/coupons/<coupon_id>', methods=['DELETE'])
@require_admin
def delete_coupon(current_user, coupon_id):
    """Delete coupon"""
    try:
        result = admin_service.delete_coupon(coupon_id, current_user['uid'], current_user['email'])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/templates', methods=['GET'])
@require_admin
def get_email_templates(current_user):
    """Get email templates"""
    try:
        page = int(request.args.get('page', 1))
        result = admin_service.get_email_templates(page)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/marketing/templates', methods=['POST'])
@require_admin
def create_email_template(current_user):
    """Create email template"""
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('subject') or not data.get('body'):
            return jsonify({'message': 'Name, subject, and body required'}), 400
        
        template = admin_service.create_email_template(data, current_user['uid'], current_user['email'])
        return jsonify(template), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/templates/<template_id>', methods=['DELETE'])
@require_admin
def delete_email_template(current_user, template_id):
    """Delete email template"""
    try:
        result = admin_service.delete_email_template(template_id, current_user['uid'], current_user['email'])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/templates/<template_id>', methods=['PUT'])
@require_admin
def update_email_template(current_user, template_id):
    """Update email template (does NOT send to anyone)"""
    try:
        data = request.get_json()
        
        template = admin_service.update_email_template(template_id, data, current_user['uid'], current_user['email'])
        return jsonify(template), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/templates/active/<template_type>', methods=['GET'])
@require_admin
def get_active_template(current_user, template_type):
    """Get active template by type (for auto-send)"""
    try:
        template = admin_service.get_active_template(template_type)
        if not template:
            return jsonify({'message': 'No active template found'}), 404
        return jsonify(template), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/marketing/campaigns', methods=['GET'])
@require_admin
def get_email_campaigns(current_user):
    """Get email campaigns history"""
    try:
        page = int(request.args.get('page', 1))
        result = admin_service.get_email_campaigns(page)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/marketing/campaigns', methods=['POST'])
@require_admin
def send_email_campaign(current_user):
    """Send email campaign"""
    try:
        data = request.get_json()
        
        if not data.get('subject') or not data.get('body') or not data.get('recipientType'):
            return jsonify({'message': 'Subject, body, and recipient type required'}), 400
        
        result = admin_service.send_email_campaign(data, current_user['uid'], current_user['email'])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/coupons/validate', methods=['POST'])
@require_auth
def validate_coupon(current_user):
    """Validate coupon code (public endpoint)"""
    try:
        data = request.get_json()
        code = data.get('code')
        user_id = data.get('userId')
        
        if not code:
            return jsonify({'message': 'Coupon code required'}), 400
        
        result = admin_service.validate_coupon(code, user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'valid': False, 'message': str(e)}), 400

@admin_bp.route('/marketing/coupons/apply', methods=['POST'])
@require_auth
def apply_coupon(current_user):
    """Apply coupon to order (public endpoint)"""
    try:
        data = request.get_json()
        code = data.get('code')
        user_id = data.get('userId')
        order_amount = data.get('orderAmount')
        
        if not code or not order_amount:
            return jsonify({'message': 'Coupon code and order amount required'}), 400
        
        result = admin_service.apply_coupon(code, user_id, order_amount)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/analytics', methods=['GET'])
@require_admin
def get_coupon_analytics(current_user):
    """Get coupon analytics"""
    try:
        analytics = admin_service.get_coupon_analytics()
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── Marketing Automation ───────────────────────────────

@admin_bp.route('/marketing/automation', methods=['GET'])
@require_admin
def get_automation_rules(current_user):
    """Get all automation rules"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        rules = db.collection('automation_rules').stream()
        rules_list = [{'id': r.id, **r.to_dict()} for r in rules]
        
        return jsonify({'rules': rules_list}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/marketing/automation', methods=['POST'])
@require_admin
def create_automation_rule(current_user):
    """Create automation rule"""
    try:
        from firebase_admin import firestore
        data = request.get_json()
        db = firestore.client()
        
        rule_data = {
            'name': data.get('name'),
            'eventType': data.get('eventType'),
            'actionType': data.get('actionType'),
            'emailTemplateId': data.get('emailTemplateId'),
            'couponCode': data.get('couponCode'),
            'segmentName': data.get('segmentName'),
            'active': data.get('active', True),
            'createdBy': current_user['email'],
            'createdAt': datetime.now(timezone.utc)
        }
        
        doc_ref = db.collection('automation_rules').add(rule_data)
        rule_data['id'] = doc_ref[1].id
        
        admin_service.log_audit(current_user['uid'], current_user['email'], 'automation.created', 'automation_rule', rule_data['id'], f'Created automation rule: {rule_data["name"]}')
        
        return jsonify(rule_data), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/automation/<rule_id>', methods=['PUT'])
@require_admin
def update_automation_rule(current_user, rule_id):
    """Update automation rule"""
    try:
        from firebase_admin import firestore
        data = request.get_json()
        db = firestore.client()
        
        doc_ref = db.collection('automation_rules').document(rule_id)
        if not doc_ref.get().exists:
            return jsonify({'message': 'Rule not found'}), 404
        
        update_data = {
            'name': data.get('name'),
            'eventType': data.get('eventType'),
            'actionType': data.get('actionType'),
            'emailTemplateId': data.get('emailTemplateId'),
            'couponCode': data.get('couponCode'),
            'segmentName': data.get('segmentName'),
            'active': data.get('active'),
            'updatedAt': datetime.now(timezone.utc)
        }
        
        doc_ref.update(update_data)
        update_data['id'] = rule_id
        
        return jsonify(update_data), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/automation/<rule_id>/toggle', methods=['POST'])
@require_admin
def toggle_automation_rule(current_user, rule_id):
    """Toggle automation rule active/inactive"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        doc_ref = db.collection('automation_rules').document(rule_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'Rule not found'}), 404
        
        current_status = doc.to_dict().get('active', False)
        new_status = not current_status
        
        doc_ref.update({'active': new_status})
        
        return jsonify({'active': new_status, 'message': f'Rule {"activated" if new_status else "deactivated"}'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/automation/<rule_id>', methods=['DELETE'])
@require_admin
def delete_automation_rule(current_user, rule_id):
    """Delete automation rule"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        doc_ref = db.collection('automation_rules').document(rule_id)
        if not doc_ref.get().exists:
            return jsonify({'message': 'Rule not found'}), 404
        
        doc_ref.delete()
        
        admin_service.log_audit(current_user['uid'], current_user['email'], 'automation.deleted', 'automation_rule', rule_id, 'Deleted automation rule')
        
        return jsonify({'message': 'Rule deleted'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/automation/logs', methods=['GET'])
@require_admin
def get_automation_logs(current_user):
    """Get automation execution logs"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        logs = db.collection('automation_logs')\
            .limit(100)\
            .stream()
        
        logs_list = [{'id': log.id, **log.to_dict()} for log in logs]
        
        return jsonify({'logs': logs_list}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/marketing/templates/<template_id>/toggle', methods=['POST'])
@require_admin
def toggle_email_template(current_user, template_id):
    """Toggle email template active/inactive"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        doc_ref = db.collection('email_templates').document(template_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'Template not found'}), 404
        
        current_status = doc.to_dict().get('active', False)
        new_status = not current_status
        
        doc_ref.update({'active': new_status})
        
        return jsonify({'active': new_status, 'message': f'Template {"activated" if new_status else "deactivated"}'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/marketing/coupons/<coupon_id>/toggle', methods=['POST'])
@require_admin
def toggle_coupon(current_user, coupon_id):
    """Toggle coupon active/inactive"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        doc_ref = db.collection('coupons').document(coupon_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'Coupon not found'}), 404
        
        current_status = doc.to_dict().get('active', False)
        new_status = not current_status
        
        doc_ref.update({'active': new_status})
        
        return jsonify({'active': new_status, 'message': f'Coupon {"activated" if new_status else "deactivated"}'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

# ─── Content Management System ──────────────────────────

@admin_bp.route('/content', methods=['GET'])
@require_admin
def get_content_pages(current_user):
    """Get all content pages"""
    try:
        page_type = request.args.get('type')
        pages = admin_service.get_content_pages(page_type)
        return jsonify(pages), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/content/<page_id>', methods=['GET'])
@require_admin
def get_content_page(current_user, page_id):
    """Get single content page (admin only)"""
    try:
        page = admin_service.get_content_page(page_id)
        return jsonify(page), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 404

@admin_bp.route('/content', methods=['POST'])
@require_admin
def create_content_page(current_user):
    """Create content page"""
    try:
        data = request.get_json()
        
        if not data.get('title') or not data.get('slug') or not data.get('type'):
            return jsonify({'message': 'Title, slug, and type required'}), 400
        
        page = admin_service.create_content_page(data, current_user['uid'], current_user['email'])
        return jsonify(page), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/content/<page_id>', methods=['PUT'])
@require_admin
def update_content_page(current_user, page_id):
    """Update content page"""
    try:
        data = request.get_json()
        
        page = admin_service.update_content_page(page_id, data, current_user['uid'], current_user['email'])
        return jsonify(page), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@admin_bp.route('/content/<page_id>', methods=['DELETE'])
@require_admin
def delete_content_page(current_user, page_id):
    """Delete content page"""
    try:
        result = admin_service.delete_content_page(page_id, current_user['uid'], current_user['email'])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 400

# ─── Advanced Analytics & Reports ───────────────────────

@admin_bp.route('/reports/analytics', methods=['GET'])
@require_admin
def get_advanced_analytics(current_user):
    """Get advanced business analytics"""
    try:
        analytics = admin_service.get_advanced_analytics()
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/reports/export', methods=['GET'])
@require_admin
def export_analytics_report(current_user):
    """Export analytics report"""
    try:
        format_type = request.args.get('format', 'csv')
        report = admin_service.export_analytics_report(format_type)
        return jsonify(report), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── API Keys Management ────────────────────────────────

@admin_bp.route('/api-keys/stats/public', methods=['GET'])
@require_admin
def get_api_key_stats_public(current_user):
    """Get API key statistics (admin only)"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        # Get all API keys
        keys_ref = db.collection('api_keys').stream()
        
        total_keys = 0
        active_keys = 0
        total_requests = 0
        unique_users = set()
        
        for key in keys_ref:
            data = key.to_dict()
            total_keys += 1
            
            if data.get('is_active', False):
                active_keys += 1
            
            total_requests += data.get('usage_count', 0)
            unique_users.add(data.get('user_id'))
        
        return jsonify({
            'totalKeys': total_keys,
            'activeKeys': active_keys,
            'totalRequests': total_requests,
            'uniqueUsers': len(unique_users)
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api-keys/stats', methods=['GET'])
@require_admin
def get_api_key_stats(current_user):
    """Get API key statistics for admin dashboard"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        # Get all API keys
        keys_ref = db.collection('api_keys').stream()
        
        total_keys = 0
        active_keys = 0
        total_requests = 0
        unique_users = set()
        
        for key in keys_ref:
            data = key.to_dict()
            total_keys += 1
            
            if data.get('is_active', False):
                active_keys += 1
            
            total_requests += data.get('usage_count', 0)
            unique_users.add(data.get('user_id'))
        
        return jsonify({
            'totalKeys': total_keys,
            'activeKeys': active_keys,
            'totalRequests': total_requests,
            'uniqueUsers': len(unique_users)
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api-keys/public', methods=['GET'])
@require_admin
def get_all_api_keys_public(current_user):
    """Get all API keys (admin only — was incorrectly public)"""
    try:
        from firebase_admin import firestore, auth
        db = firestore.client()
        
        keys_ref = db.collection('api_keys').stream()
        keys = []
        
        for key in keys_ref:
            data = key.to_dict()
            
            # Get user details from Firebase Auth
            user_email = "Unknown"
            user_name = "Unknown"
            try:
                user_record = auth.get_user(data['user_id'])
                user_email = user_record.email or "Unknown"
                user_name = user_record.display_name or user_email.split('@')[0]
            except:
                pass
            
            keys.append({
                'id': data['id'],
                'name': data['name'],
                'user_id': data['user_id'],
                'user_email': user_email,
                'user_name': user_name,
                'key_prefix': data['key_prefix'],
                'tier': data['tier'],
                'is_active': data['is_active'],
                'usage_count': data['usage_count'],
                'last_used': data['last_used'].isoformat() if data['last_used'] else None,
                'created_at': data['created_at'].isoformat(),
                'status': 'Active' if data['is_active'] else 'Revoked'
            })
        
        return jsonify({'keys': keys}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api-keys', methods=['GET'])
@require_admin
def get_all_api_keys(current_user):
    """Get all API keys across all users with user details"""
    try:
        from firebase_admin import firestore, auth
        db = firestore.client()
        
        keys_ref = db.collection('api_keys').stream()
        keys = []
        
        for key in keys_ref:
            data = key.to_dict()
            
            # Get user details from Firebase Auth
            user_email = "Unknown"
            user_name = "Unknown"
            try:
                user_record = auth.get_user(data['user_id'])
                user_email = user_record.email or "Unknown"
                user_name = user_record.display_name or user_email.split('@')[0]
            except:
                # Fallback: try to get from users collection
                try:
                    user_doc = db.collection('users').document(data['user_id']).get()
                    if user_doc.exists:
                        user_data = user_doc.to_dict()
                        user_email = user_data.get('email', 'Unknown')
                        user_name = user_data.get('displayName', user_email.split('@')[0])
                except:
                    pass
            
            keys.append({
                'id': data['id'],
                'name': data['name'],
                'user_id': data['user_id'],
                'user_email': user_email,
                'user_name': user_name,
                'key_prefix': data['key_prefix'],
                'tier': data['tier'],
                'is_active': data['is_active'],
                'usage_count': data['usage_count'],
                'last_used': data['last_used'].isoformat() if data['last_used'] else None,
                'created_at': data['created_at'].isoformat(),
                'status': 'Active' if data['is_active'] else 'Revoked'
            })
        
        return jsonify({'keys': keys}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api-keys/<key_id>/delete/public', methods=['POST'])
@require_admin
def delete_api_key_public(current_user, key_id):
    """Delete API key completely (admin only — was incorrectly public)"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'API key not found'}), 404
        
        # Delete the document completely
        doc_ref.delete()
        
        return jsonify({'message': 'API key deleted completely'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api-keys/<key_id>', methods=['DELETE'])
@require_admin
def delete_api_key(current_user, key_id):
    """Delete API key permanently (admin)"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'API key not found'}), 404
        
        key_data = doc.to_dict()
        
        # Delete the document completely
        doc_ref.delete()
        
        # Log audit
        admin_service.log_audit(current_user['uid'], current_user['email'], 'api_key.deleted', 'api_key', key_id, 
                               f'Deleted API key {key_data.get("name")} for user {key_data.get("user_id")}')
        
        return jsonify({'message': 'API key deleted permanently'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api-keys/<key_id>/revoke', methods=['POST'])
@require_admin
def revoke_api_key(current_user, key_id):
    """Revoke API key (mark as inactive)"""
    try:
        from firebase_admin import firestore
        from datetime import datetime, timezone
        db = firestore.client()
        
        doc_ref = db.collection('api_keys').document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'API key not found'}), 404
        
        key_data = doc.to_dict()
        
        # Update to inactive
        doc_ref.update({
            'is_active': False,
            'revoked_at': datetime.now(timezone.utc),
            'revoked_by': current_user['uid']
        })
        
        # Log audit
        admin_service.log_audit(current_user['uid'], current_user['email'], 'api_key.revoked', 'api_key', key_id,
                               f'Revoked API key {key_data.get("name")} for user {key_data.get("user_id")}')
        
        return jsonify({'message': 'API key revoked successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ─── Unified Subscription Management ────────────────────

@admin_bp.route('/subscriptions/all', methods=['GET'])
@require_admin
def get_all_subscriptions(current_user):
    """Get all subscriptions (platform + API) with unified view"""
    try:
        from firebase_admin import firestore, auth
        db = firestore.client()
        
        # Get platform subscriptions
        platform_subs = db.collection('subscriptions').stream()
        
        # Get API subscriptions
        api_subs = db.collection('api_subscriptions').stream()
        
        all_subscriptions = []
        
        # Process platform subscriptions
        for sub in platform_subs:
            data = sub.to_dict()
            user_email = "Unknown"
            user_name = "Unknown"
            
            try:
                user_record = auth.get_user(data['userId'])
                user_email = user_record.email or "Unknown"
                user_name = user_record.display_name or user_email.split('@')[0]
            except:
                pass
            
            all_subscriptions.append({
                'id': sub.id,
                'type': 'platform',
                'userId': data['userId'],
                'userEmail': user_email,
                'userName': user_name,
                'planId': data['planId'],
                'planName': data['planName'],
                'status': data['status'],
                'amount': data.get('amount', 0),
                'analysesUsed': data.get('analysesUsed', 0),
                'analysesLimit': data.get('analysesLimit', 0),
                'apiRequestsUsed': data.get('apiRequestsUsed', 0),
                'apiRequestsLimit': data.get('apiRequestsLimit', 0),
                'startDate': data['startDate'].isoformat() if data.get('startDate') else None,
                'endDate': data['endDate'].isoformat() if data.get('endDate') else None,
                'paymentId': data.get('paymentId'),
                'autoRenew': data.get('autoRenew', False)
            })
        
        # Process API subscriptions
        for sub in api_subs:
            data = sub.to_dict()
            user_email = "Unknown"
            user_name = "Unknown"
            
            try:
                user_record = auth.get_user(data['userId'])
                user_email = user_record.email or "Unknown"
                user_name = user_record.display_name or user_email.split('@')[0]
            except:
                pass
            
            all_subscriptions.append({
                'id': sub.id,
                'type': 'api',
                'userId': data['userId'],
                'userEmail': user_email,
                'userName': user_name,
                'planId': data['planId'],
                'planName': data['planName'],
                'status': data['status'],
                'amount': 0,  # API subscriptions store price in plan
                'requestsUsed': data.get('requestsUsed', 0),
                'requestsLimit': data.get('requestsLimit', 0),
                'rateLimit': data.get('rateLimit', 0),
                'startDate': data['startDate'].isoformat() if data.get('startDate') else None,
                'endDate': data['endDate'].isoformat() if data.get('endDate') else None,
                'paymentId': data.get('paymentId'),
                'autoRenew': data.get('autoRenew', False),
                'lastNotifiedAt': data.get('lastNotifiedAt', 0)
            })
        
        # Sort by start date (newest first)
        all_subscriptions.sort(key=lambda x: x['startDate'] or '', reverse=True)
        
        # Calculate stats
        total_subs = len(all_subscriptions)
        active_subs = len([s for s in all_subscriptions if s['status'] == 'active'])
        platform_subs_count = len([s for s in all_subscriptions if s['type'] == 'platform'])
        api_subs_count = len([s for s in all_subscriptions if s['type'] == 'api'])
        
        return jsonify({
            'subscriptions': all_subscriptions,
            'stats': {
                'total': total_subs,
                'active': active_subs,
                'platform': platform_subs_count,
                'api': api_subs_count
            }
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/subscriptions/<sub_type>/<sub_id>/cancel', methods=['POST'])
@require_admin
def cancel_subscription(current_user, sub_type, sub_id):
    """Cancel subscription (platform or API)"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        collection = 'subscriptions' if sub_type == 'platform' else 'api_subscriptions'
        doc_ref = db.collection(collection).document(sub_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'Subscription not found'}), 404
        
        doc_ref.update({
            'status': 'cancelled',
            'cancelledAt': datetime.now(timezone.utc),
            'cancelledBy': current_user['uid']
        })
        
        admin_service.log_audit(current_user['uid'], current_user['email'], 
                               f'{sub_type}_subscription.cancelled', collection, sub_id,
                               f'Cancelled {sub_type} subscription')
        
        return jsonify({'message': 'Subscription cancelled successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/subscriptions/api/<sub_id>/reset-usage', methods=['POST'])
@require_admin
def reset_api_usage(current_user, sub_id):
    """Reset API subscription usage counter"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        doc_ref = db.collection('api_subscriptions').document(sub_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'API subscription not found'}), 404
        
        doc_ref.update({
            'requestsUsed': 0,
            'lastNotifiedAt': 0,
            'usageResetAt': datetime.now(timezone.utc),
            'usageResetBy': current_user['uid']
        })
        
        admin_service.log_audit(current_user['uid'], current_user['email'],
                               'api_subscription.usage_reset', 'api_subscriptions', sub_id,
                               'Reset API usage counter')
        
        return jsonify({'message': 'API usage reset successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/subscriptions/api/<sub_id>/extend', methods=['POST'])
@require_admin
def extend_api_subscription(current_user, sub_id):
    """Extend API subscription end date"""
    try:
        from firebase_admin import firestore
        from datetime import timedelta
        data = request.get_json()
        days = data.get('days', 30)
        
        db = firestore.client()
        doc_ref = db.collection('api_subscriptions').document(sub_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'message': 'API subscription not found'}), 404
        
        sub_data = doc.to_dict()
        current_end = sub_data.get('endDate')
        
        if current_end:
            new_end = current_end + timedelta(days=days)
        else:
            new_end = datetime.now(timezone.utc) + timedelta(days=days)
        
        doc_ref.update({
            'endDate': new_end,
            'extendedAt': datetime.now(timezone.utc),
            'extendedBy': current_user['uid']
        })
        
        admin_service.log_audit(current_user['uid'], current_user['email'],
                               'api_subscription.extended', 'api_subscriptions', sub_id,
                               f'Extended API subscription by {days} days')
        
        return jsonify({
            'message': f'Subscription extended by {days} days',
            'newEndDate': new_end.isoformat()
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ─── Webhooks Management ────────────────────────────────

@admin_bp.route('/webhooks', methods=['GET'])
@require_admin
def get_webhooks(current_user):
    """Get all user webhooks"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        docs = db.collection('webhooks').stream()
        webhooks = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'createdAt' in data and hasattr(data['createdAt'], 'isoformat'):
                data['createdAt'] = data['createdAt'].isoformat() + 'Z'
            webhooks.append(data)
        return jsonify({'webhooks': webhooks}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/webhooks/<webhook_id>', methods=['DELETE'])
@require_admin
def delete_webhook(current_user, webhook_id):
    """Delete a webhook"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        doc_ref = db.collection('webhooks').document(webhook_id)
        if not doc_ref.get().exists:
            return jsonify({'message': 'Webhook not found'}), 404
        doc_ref.delete()
        admin_service.log_audit(current_user['uid'], current_user['email'], 'webhook.deleted', 'webhook', webhook_id, 'Deleted webhook')
        return jsonify({'message': 'Webhook deleted'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/subscriptions/stats', methods=['GET'])
@require_admin
def get_subscription_stats(current_user):
    """Get comprehensive subscription statistics"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        
        # Platform subscriptions
        platform_subs = list(db.collection('subscriptions').stream())
        platform_active = len([s for s in platform_subs if s.to_dict().get('status') == 'active'])
        platform_revenue = sum([s.to_dict().get('amount', 0) for s in platform_subs if s.to_dict().get('status') == 'active'])
        
        # API subscriptions
        api_subs = list(db.collection('api_subscriptions').stream())
        api_active = len([s for s in api_subs if s.to_dict().get('status') == 'active'])
        
        # API usage stats
        total_api_requests = sum([s.to_dict().get('requestsUsed', 0) for s in api_subs])
        api_users_near_limit = len([s for s in api_subs if s.to_dict().get('status') == 'active' and 
                                     s.to_dict().get('requestsLimit', 0) > 0 and
                                     (s.to_dict().get('requestsUsed', 0) / s.to_dict().get('requestsLimit', 1)) >= 0.8])
        
        return jsonify({
            'platform': {
                'total': len(platform_subs),
                'active': platform_active,
                'revenue': platform_revenue / 100  # Convert paise to rupees
            },
            'api': {
                'total': len(api_subs),
                'active': api_active,
                'totalRequests': total_api_requests,
                'usersNearLimit': api_users_near_limit
            },
            'combined': {
                'totalSubscriptions': len(platform_subs) + len(api_subs),
                'totalActive': platform_active + api_active
            }
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
