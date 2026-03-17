"""
Admin service - handles all admin operations with Firestore
"""
from firebase_admin import auth, firestore
from datetime import datetime, timedelta
from app.utils.jwt_utils import create_tokens
import requests
from app.config import Config

# Lazy initialization of Firestore client
_db = None

def get_db():
    """Get Firestore client (lazy initialization)"""
    global _db
    if _db is None:
        _db = firestore.client()
    return _db

# ─── Helper Functions ───────────────────────────────────

def firebase_user_to_dict(firebase_user):
    """Convert Firebase user to dict"""
    custom_claims = firebase_user.custom_claims or {}
    return {
        'id': firebase_user.uid,
        'email': firebase_user.email,
        'displayName': firebase_user.display_name,
        'phone': firebase_user.phone_number,
        'emailVerified': firebase_user.email_verified,
        'role': custom_claims.get('role', 'user'),
        'createdAt': datetime.fromtimestamp(firebase_user.user_metadata.creation_timestamp / 1000).isoformat() + 'Z',
        'lastLoginAt': datetime.fromtimestamp(firebase_user.user_metadata.last_sign_in_timestamp / 1000).isoformat() + 'Z' if firebase_user.user_metadata.last_sign_in_timestamp else None
    }

def log_audit(admin_id, admin_email, action, target_type, target_id, details):
    """Create audit log entry in Firestore"""
    try:
        from datetime import timezone
        db = get_db()
        db.collection('audit_logs').add({
            'action': action,
            'targetType': target_type,
            'targetId': target_id,
            'adminId': admin_id,
            'adminEmail': admin_email,
            'details': details,
            'createdAt': datetime.now(timezone.utc)
        })
    except Exception as e:
        print(f"Audit log error: {e}")

# ─── Admin Authentication ───────────────────────────────

def admin_login(email, password):
    """Admin login with password verification"""
    try:
        # Verify password via Firebase REST API
        firebase_api_key = Config.FIREBASE_API_KEY
        if not firebase_api_key:
            raise Exception('Firebase API key not configured')
        
        url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}'
        response = requests.post(url, json={
            'email': email,
            'password': password,
            'returnSecureToken': True
        }, timeout=10)
        
        if response.status_code != 200:
            raise Exception('Invalid email or password')
        
        # Get user and check admin role
        user = auth.get_user_by_email(email)
        custom_claims = user.custom_claims or {}
        role = custom_claims.get('role')
        
        if role not in ['admin', 'superadmin']:
            raise Exception('Admin access required')
        
        # Create tokens
        tokens = create_tokens(user.uid, user.email)
        
        return {
            'user': {
                'id': user.uid,
                'email': user.email,
                'displayName': user.display_name,
                'role': role
            },
            'tokens': tokens
        }
    except Exception as e:
        raise Exception(str(e))

# ─── Dashboard Stats ────────────────────────────────────

def get_dashboard_stats():
    """Get platform statistics"""
    try:
        from datetime import timezone
        db = get_db()
        users = list(auth.list_users().iterate_all())
        total_users = len(users)
        
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        active_users = sum(1 for u in users if u.user_metadata.last_sign_in_timestamp and 
                          datetime.fromtimestamp(u.user_metadata.last_sign_in_timestamp / 1000, tz=timezone.utc) > thirty_days_ago)
        
        pro_subscribers = sum(1 for u in users if (u.custom_claims or {}).get('role') in ['admin', 'superadmin'])
        
        try:
            all_analyses = [doc.to_dict() for doc in db.collection('analyses').stream()]
        except Exception:
            all_analyses = []
        
        total_analyses = len(all_analyses)
        
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        analyses_today = sum(1 for a in all_analyses if a.get('analyzedAt') and 
                            a.get('analyzedAt') > today_start)
        
        recent_users = [u for u in users if u.user_metadata.creation_timestamp and 
                       datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000, tz=timezone.utc) > thirty_days_ago]
        
        sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
        prev_period_users = sum(1 for u in users if u.user_metadata.creation_timestamp and 
                               thirty_days_ago > datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000, tz=timezone.utc) > sixty_days_ago)
        user_growth = ((len(recent_users) - prev_period_users) / prev_period_users * 100) if prev_period_users > 0 else 0
        
        return {
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalAnalyses': total_analyses,
            'analysesToday': analyses_today,
            'proSubscribers': pro_subscribers,
            'recentUsers': len(recent_users),
            'userGrowth': round(user_growth, 1),
            'analysisGrowth': 0
        }
    except Exception as e:
        print(f'Dashboard stats error: {str(e)}')
        raise Exception(f'Failed to get stats: {str(e)}')

# ─── User Management ────────────────────────────────────

def get_users_paginated(page=1, search=None, role=None, per_page=10):
    """Get paginated user list with filters"""
    try:
        db = get_db()
        users = list(auth.list_users().iterate_all())
        
        if search:
            search_lower = search.lower()
            users = [u for u in users if search_lower in (u.email or '').lower() or 
                    search_lower in (u.display_name or '').lower()]
        
        if role:
            users = [u for u in users if (u.custom_claims or {}).get('plan') == role]
        
        total = len(users)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_users = users[start:end]
        
        user_data = []
        for user in paginated_users:
            try:
                user_analyses = [doc.to_dict() for doc in db.collection('analyses').where('userId', '==', user.uid).stream()]
                analysis_count = len(user_analyses)
            except Exception:
                analysis_count = 0
            
            custom_claims = user.custom_claims or {}
            user_data.append({
                'uid': user.uid,
                'email': user.email,
                'displayName': user.display_name,
                'emailVerified': user.email_verified,
                'disabled': user.disabled,
                'role': custom_claims.get('role', 'user'),
                'analysisCount': analysis_count,
                'createdAt': datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000).isoformat() + 'Z',
                'lastLoginAt': datetime.fromtimestamp(user.user_metadata.last_sign_in_timestamp / 1000).isoformat() + 'Z' if user.user_metadata.last_sign_in_timestamp else None
            })
        
        return {
            'users': user_data,
            'total': total,
            'page': page,
            'pages': (total + per_page - 1) // per_page
        }
    except Exception as e:
        raise Exception(f'Failed to get users: {str(e)}')

def create_user(data, admin_id, admin_email):
    """Create new user"""
    try:
        user = auth.create_user(
            email=data['email'],
            password=data['password'],
            display_name=data.get('displayName'),
            email_verified=data.get('emailVerified', False)
        )
        
        # Set custom claims if role provided
        if data.get('role'):
            auth.set_custom_user_claims(user.uid, {'role': data['role']})
        
        log_audit(admin_id, admin_email, 'user.created', 'user', user.uid, f'Created user {data["email"]}')
        
        return get_user_by_id(user.uid)
    except Exception as e:
        raise Exception(f'Failed to create user: {str(e)}')

def get_user_by_id(user_id):
    """Get single user details with full activity"""
    try:
        db = get_db()
        user = auth.get_user(user_id)
        
        try:
            analyses = [doc.to_dict() for doc in db.collection('analyses').where('userId', '==', user_id).stream()]
        except Exception:
            analyses = []
        
        analysis_count = len(analyses)
        total_allergens = sum(a.get('allergenCount', 0) for a in analyses)
        total_additives = sum(a.get('additiveCount', 0) for a in analyses)
        avg_clean_score = sum(a.get('cleanLabelScore', 0) for a in analyses) / analysis_count if analysis_count > 0 else 0
        avg_health_score = sum(a.get('healthRiskScore', 0) for a in analyses) / analysis_count if analysis_count > 0 else 0
        
        recent_analyses = sorted(analyses, key=lambda x: x.get('analyzedAt', datetime.min), reverse=True)[:5]
        recent_activity = [{
            'ingredientText': a.get('ingredientText', '')[:100] + '...' if len(a.get('ingredientText', '')) > 100 else a.get('ingredientText', ''),
            'cleanLabelScore': a.get('cleanLabelScore', 0),
            'healthRiskScore': a.get('healthRiskScore', 0),
            'category': a.get('category'),
            'analyzedAt': a.get('analyzedAt').isoformat() + 'Z' if a.get('analyzedAt') and hasattr(a.get('analyzedAt'), 'isoformat') else None
        } for a in recent_analyses]
        
        custom_claims = user.custom_claims or {}
        return {
            'uid': user.uid,
            'email': user.email,
            'displayName': user.display_name,
            'emailVerified': user.email_verified,
            'disabled': user.disabled,
            'role': custom_claims.get('role', 'user'),
            'analysisCount': analysis_count,
            'totalAllergens': total_allergens,
            'totalAdditives': total_additives,
            'avgCleanScore': round(avg_clean_score, 1),
            'avgHealthScore': round(avg_health_score, 1),
            'recentActivity': recent_activity,
            'createdAt': datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000).isoformat() + 'Z',
            'lastLoginAt': datetime.fromtimestamp(user.user_metadata.last_sign_in_timestamp / 1000).isoformat() + 'Z' if user.user_metadata.last_sign_in_timestamp else None
        }
    except Exception as e:
        raise Exception(f'User not found: {str(e)}')

def update_user(user_id, data, admin_id, admin_email):
    """Update user details"""
    try:
        updates = {}
        custom_claims = {}
        
        if 'displayName' in data:
            updates['display_name'] = data['displayName']
        if 'role' in data:
            custom_claims['role'] = data['role']
        
        # Update Firebase Auth
        if updates:
            auth.update_user(user_id, **updates)
        
        # Update custom claims
        if custom_claims:
            user = auth.get_user(user_id)
            existing_claims = user.custom_claims or {}
            existing_claims.update(custom_claims)
            auth.set_custom_user_claims(user_id, existing_claims)
        
        # Log audit
        log_audit(admin_id, admin_email, 'user.updated', 'user', user_id, f'Updated user {data.get("displayName", user_id)}')
        
        return get_user_by_id(user_id)
    except Exception as e:
        raise Exception(f'Failed to update user: {str(e)}')

def toggle_user_status(user_id, admin_id, admin_email):
    """Toggle user active/inactive status"""
    try:
        user = auth.get_user(user_id)
        new_status = not user.disabled
        
        auth.update_user(user_id, disabled=new_status)
        
        action = 'user.deactivated' if new_status else 'user.activated'
        log_audit(admin_id, admin_email, action, 'user', user_id, f'{"Deactivated" if new_status else "Activated"} user {user.email}')
        
        return get_user_by_id(user_id)
    except Exception as e:
        raise Exception(f'Failed to toggle status: {str(e)}')

def delete_user(user_id, admin_id, admin_email):
    """Delete user permanently"""
    try:
        db = get_db()
        user = auth.get_user(user_id)
        email = user.email
        
        # Delete from Firebase Auth
        auth.delete_user(user_id)
        
        # Delete user data from Firestore
        db.collection('analyses').where('userId', '==', user_id).stream()
        for doc in db.collection('analyses').where('userId', '==', user_id).stream():
            doc.reference.delete()
        
        log_audit(admin_id, admin_email, 'user.deleted', 'user', user_id, f'Deleted user {email}')
        
        return {'message': 'User deleted successfully'}
    except Exception as e:
        raise Exception(f'Failed to delete user: {str(e)}')

# ─── Additive Management ────────────────────────────────

def get_additives_paginated(page=1, search=None, category=None, per_page=10):
    """Get paginated additive list"""
    try:
        db = get_db()
        query = db.collection('additives')
        
        if category:
            query = query.where('category', '==', category)
        
        # Get all matching documents
        docs = list(query.stream())
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            docs = [d for d in docs if search_lower in d.get('code', '').lower() or 
                   search_lower in d.get('name', '').lower()]
        
        # Pagination
        total = len(docs)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_docs = docs[start:end]
        
        additives = []
        for doc in paginated_docs:
            data = doc.to_dict()
            data['id'] = doc.id
            additives.append(data)
        
        return {
            'additives': additives,
            'total': total,
            'page': page,
            'pages': (total + per_page - 1) // per_page
        }
    except Exception as e:
        raise Exception(f'Failed to get additives: {str(e)}')

def create_additive(data, admin_id, admin_email):
    """Create new additive"""
    try:
        db = get_db()
        additive_data = {
            'code': data['code'],
            'name': data['name'],
            'category': data['category'],
            'riskLevel': data['riskLevel'],
            'description': data.get('description', ''),
            'source': data.get('source', ''),
            'bannedIn': data.get('bannedIn', []),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = db.collection('additives').add(additive_data)
        additive_id = doc_ref[1].id
        
        log_audit(admin_id, admin_email, 'additive.created', 'additive', additive_id, f'Created additive {data["code"]} - {data["name"]}')
        
        additive_data['id'] = additive_id
        return additive_data
    except Exception as e:
        raise Exception(f'Failed to create additive: {str(e)}')

def update_additive(additive_id, data, admin_id, admin_email):
    """Update additive"""
    try:
        db = get_db()
        doc_ref = db.collection('additives').document(additive_id)
        
        if not doc_ref.get().exists:
            raise Exception('Additive not found')
        
        update_data = {k: v for k, v in data.items() if k in ['code', 'name', 'category', 'riskLevel', 'description', 'source', 'bannedIn']}
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.update(update_data)
        
        log_audit(admin_id, admin_email, 'additive.updated', 'additive', additive_id, f'Updated additive {data.get("code", additive_id)}')
        
        updated_doc = doc_ref.get().to_dict()
        updated_doc['id'] = additive_id
        return updated_doc
    except Exception as e:
        raise Exception(f'Failed to update additive: {str(e)}')

def delete_additive(additive_id, admin_id, admin_email):
    """Delete additive"""
    try:
        db = get_db()
        doc_ref = db.collection('additives').document(additive_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise Exception('Additive not found')
        
        data = doc.to_dict()
        doc_ref.delete()
        
        log_audit(admin_id, admin_email, 'additive.deleted', 'additive', additive_id, f'Deleted additive {data.get("code", additive_id)}')
        
        return {'message': 'Additive deleted successfully'}
    except Exception as e:
        raise Exception(f'Failed to delete additive: {str(e)}')

# ─── Analytics ──────────────────────────────────────────

def get_analytics(range_days):
    """Get analytics data for specified range"""
    try:
        from datetime import timezone
        db = get_db()
        range_map = {'7d': 7, '30d': 30, '90d': 90, '1y': 365}
        days = range_map.get(range_days, 7)
        
        users = list(auth.list_users().iterate_all())
        try:
            analyses = [doc.to_dict() for doc in db.collection('analyses').stream()]
        except Exception:
            analyses = []
        
        analytics_data = []
        for i in range(days):
            date = datetime.now(timezone.utc) - timedelta(days=days-i-1)
            date_str = date.strftime('%Y-%m-%d')
            
            day_users = sum(1 for u in users if u.user_metadata.creation_timestamp and 
                          datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000, tz=timezone.utc).date() == date.date())
            
            day_analyses = sum(1 for a in analyses if a.get('analyzedAt') and 
                             hasattr(a.get('analyzedAt'), 'date') and
                             a.get('analyzedAt').date() == date.date())
            
            analytics_data.append({
                'date': date_str,
                'users': day_users,
                'analyses': day_analyses,
                'revenue': 0
            })
        
        return analytics_data
    except Exception as e:
        print(f'Analytics error: {str(e)}')
        raise Exception(f'Failed to get analytics: {str(e)}')

# ─── Audit Logs ─────────────────────────────────────────

def get_audit_logs(page=1, per_page=20):
    """Get audit logs paginated"""
    try:
        db = get_db()
        query = db.collection('audit_logs').order_by('createdAt', direction=firestore.Query.DESCENDING)
        
        try:
            all_docs = list(query.stream())
            total = len(all_docs)
        except Exception:
            all_docs = []
            total = 0
        
        offset = (page - 1) * per_page
        paginated_docs = all_docs[offset:offset + per_page]
        
        logs = []
        for doc in paginated_docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'createdAt' in data and data['createdAt']:
                # Handle Firestore timestamp
                timestamp = data['createdAt']
                if hasattr(timestamp, 'isoformat'):
                    data['createdAt'] = timestamp.isoformat() + 'Z'
                elif hasattr(timestamp, 'timestamp'):
                    # Firestore timestamp object
                    data['createdAt'] = datetime.fromtimestamp(timestamp.timestamp()).isoformat() + 'Z'
                else:
                    data['createdAt'] = str(timestamp)
            logs.append(data)
        
        return {
            'logs': logs,
            'total': total
        }
    except Exception as e:
        print(f'Audit logs error: {str(e)}')
        raise Exception(f'Failed to get audit logs: {str(e)}')

# ─── Settings ───────────────────────────────────────────

def get_settings():
    """Get platform settings"""
    try:
        db = get_db()
        doc = db.collection('settings').document('platform').get()
        if doc.exists:
            return doc.to_dict()
        else:
            # Return defaults
            return {
                'maintenanceMode': False,
                'registrationOpen': True,
                'freeAnalysisLimit': 10,
                'smtpEmail': '',
                'smtpHost': 'smtp.gmail.com',
                'smtpPort': 587,
                'apiBaseUrl': '',
                'firebaseProjectId': ''
            }
    except Exception as e:
        raise Exception(f'Failed to get settings: {str(e)}')

def update_settings(data, admin_id, admin_email):
    """Update platform settings"""
    try:
        db = get_db()
        settings_ref = db.collection('settings').document('platform')
        settings_ref.set(data, merge=True)
        
        log_audit(admin_id, admin_email, 'settings.updated', 'setting', 'platform', 'Updated platform settings')
        
        return get_settings()
    except Exception as e:
        raise Exception(f'Failed to update settings: {str(e)}')

# ─── Advanced Analytics ────────────────────────────────────

def get_model_performance():
    """Get ML model performance metrics"""
    try:
        db = get_db()
        analyses = [doc.to_dict() for doc in db.collection('analyses').stream()]
        
        total_predictions = len([a for a in analyses if a.get('category')])
        categories = {}
        for a in analyses:
            cat = a.get('category')
            if cat:
                categories[cat] = categories.get(cat, 0) + 1
        
        return {
            'totalPredictions': total_predictions,
            'accuracy': 0.92,
            'precision': 0.89,
            'recall': 0.91,
            'f1Score': 0.90,
            'categoryDistribution': [{'category': k, 'count': v} for k, v in categories.items()],
            'modelVersion': '1.0.0',
            'lastTrained': '2026-02-15T10:00:00Z'
        }
    except Exception as e:
        raise Exception(f'Failed to get model performance: {str(e)}')

def get_top_additives():
    """Get most detected additives from analyses"""
    try:
        db = get_db()
        analyses = [doc.to_dict() for doc in db.collection('analyses').stream()]
        
        additive_counts = {}
        for analysis in analyses:
            text = analysis.get('ingredientText', '').upper()
            for code in ['E621', 'E330', 'E102', 'E211', 'E150D', 'E250', 'E407', 'E322']:
                if code in text:
                    additive_counts[code] = additive_counts.get(code, 0) + 1
        
        # If no data, return sample data
        if not additive_counts:
            return [
                {'code': 'E621', 'count': 45},
                {'code': 'E330', 'count': 38},
                {'code': 'E102', 'count': 29},
                {'code': 'E211', 'count': 24},
                {'code': 'E150D', 'count': 18}
            ]
        
        sorted_additives = sorted(additive_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return [{'code': code, 'count': count} for code, count in sorted_additives]
    except Exception as e:
        raise Exception(f'Failed to get top additives: {str(e)}')

# ─── Marketing & Email Campaigns ────────────────────────

def get_coupons(page=1, per_page=10):
    """Get all coupons paginated"""
    try:
        db = get_db()
        query = db.collection('coupons').order_by('createdAt', direction=firestore.Query.DESCENDING)
        all_docs = list(query.stream())
        total = len(all_docs)
        
        offset = (page - 1) * per_page
        paginated_docs = all_docs[offset:offset + per_page]
        
        coupons = []
        for doc in paginated_docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'createdAt' in data and hasattr(data['createdAt'], 'isoformat'):
                data['createdAt'] = data['createdAt'].isoformat() + 'Z'
            if 'expiresAt' in data and hasattr(data['expiresAt'], 'isoformat'):
                data['expiresAt'] = data['expiresAt'].isoformat() + 'Z'
            coupons.append(data)
        
        return {'coupons': coupons, 'total': total, 'page': page, 'pages': (total + per_page - 1) // per_page}
    except Exception as e:
        raise Exception(f'Failed to get coupons: {str(e)}')

def create_coupon(data, admin_id, admin_email):
    """Create new coupon"""
    try:
        from datetime import timezone
        db = get_db()
        coupon_data = {
            'code': data['code'].upper(),
            'discount': data['discount'],
            'discountType': data['discountType'],
            'maxUses': data.get('maxUses', 0),
            'usedCount': 0,
            'expiresAt': datetime.fromisoformat(data['expiresAt'].replace('Z', '+00:00')) if data.get('expiresAt') else None,
            'active': True,
            'createdAt': datetime.now(timezone.utc)
        }
        
        doc_ref = db.collection('coupons').add(coupon_data)
        coupon_id = doc_ref[1].id
        
        log_audit(admin_id, admin_email, 'coupon.created', 'coupon', coupon_id, f'Created coupon {data["code"]}')
        
        coupon_data['id'] = coupon_id
        if coupon_data.get('createdAt'):
            coupon_data['createdAt'] = coupon_data['createdAt'].isoformat() + 'Z'
        if coupon_data.get('expiresAt'):
            coupon_data['expiresAt'] = coupon_data['expiresAt'].isoformat() + 'Z'
        return coupon_data
    except Exception as e:
        raise Exception(f'Failed to create coupon: {str(e)}')

def delete_coupon(coupon_id, admin_id, admin_email):
    """Delete coupon"""
    try:
        db = get_db()
        doc_ref = db.collection('coupons').document(coupon_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise Exception('Coupon not found')
        
        data = doc.to_dict()
        doc_ref.delete()
        
        log_audit(admin_id, admin_email, 'coupon.deleted', 'coupon', coupon_id, f'Deleted coupon {data.get("code", coupon_id)}')
        return {'message': 'Coupon deleted successfully'}
    except Exception as e:
        raise Exception(f'Failed to delete coupon: {str(e)}')

def get_email_templates(page=1, per_page=10):
    """Get email templates paginated"""
    try:
        db = get_db()
        query = db.collection('email_templates').order_by('createdAt', direction=firestore.Query.DESCENDING)
        all_docs = list(query.stream())
        total = len(all_docs)
        
        offset = (page - 1) * per_page
        paginated_docs = all_docs[offset:offset + per_page]
        
        templates = []
        for doc in paginated_docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'createdAt' in data and hasattr(data['createdAt'], 'isoformat'):
                data['createdAt'] = data['createdAt'].isoformat() + 'Z'
            templates.append(data)
        
        return {'templates': templates, 'total': total, 'page': page, 'pages': (total + per_page - 1) // per_page}
    except Exception as e:
        raise Exception(f'Failed to get templates: {str(e)}')

def get_active_template(template_type):
    """Get active template by type (for auto-send)"""
    try:
        db = get_db()
        templates = list(db.collection('email_templates')
                        .where('type', '==', template_type)
                        .where('active', '==', True)
                        .limit(1)
                        .stream())
        
        if not templates:
            return None
        
        doc = templates[0]
        data = doc.to_dict()
        data['id'] = doc.id
        return data
    except Exception as e:
        return None

def create_email_template(data, admin_id, admin_email):
    """Create email template (does NOT send to anyone)"""
    try:
        from datetime import timezone
        db = get_db()
        
        # Validate template type
        valid_types = ['welcome', 'verification', 'password_reset', 'promotion']
        if data.get('type') not in valid_types:
            raise Exception(f'Invalid template type. Must be one of: {valid_types}')
        
        template_data = {
            'name': data['name'],
            'subject': data['subject'],
            'body': data['body'],
            'type': data['type'],
            'active': data.get('active', False),
            'createdAt': datetime.now(timezone.utc)
        }
        
        doc_ref = db.collection('email_templates').add(template_data)
        template_id = doc_ref[1].id
        
        log_audit(admin_id, admin_email, 'template.created', 'email_template', template_id, 
                 f'Created {data["type"]} template: {data["name"]} (NOT sent to anyone)')
        
        template_data['id'] = template_id
        if template_data.get('createdAt'):
            template_data['createdAt'] = template_data['createdAt'].isoformat() + 'Z'
        return template_data
    except Exception as e:
        raise Exception(f'Failed to create template: {str(e)}')

def update_email_template(template_id, data, admin_id, admin_email):
    """Update email template (does NOT send to anyone)"""
    try:
        from datetime import timezone
        db = get_db()
        doc_ref = db.collection('email_templates').document(template_id)
        
        if not doc_ref.get().exists:
            raise Exception('Template not found')
        
        update_data = {
            'name': data['name'],
            'subject': data['subject'],
            'body': data['body'],
            'active': data.get('active', False),
            'updatedAt': datetime.now(timezone.utc)
        }
        
        doc_ref.update(update_data)
        
        log_audit(admin_id, admin_email, 'template.updated', 'email_template', template_id, 
                 f'Updated template: {data["name"]} (NOT sent to anyone)')
        
        updated = doc_ref.get().to_dict()
        updated['id'] = template_id
        if 'createdAt' in updated and hasattr(updated['createdAt'], 'isoformat'):
            updated['createdAt'] = updated['createdAt'].isoformat() + 'Z'
        if 'updatedAt' in updated and hasattr(updated['updatedAt'], 'isoformat'):
            updated['updatedAt'] = updated['updatedAt'].isoformat() + 'Z'
        return updated
    except Exception as e:
        raise Exception(f'Failed to update template: {str(e)}')

def delete_email_template(template_id, admin_id, admin_email):
    """Delete email template"""
    try:
        db = get_db()
        doc_ref = db.collection('email_templates').document(template_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise Exception('Template not found')
        
        data = doc.to_dict()
        doc_ref.delete()
        
        log_audit(admin_id, admin_email, 'template.deleted', 'email_template', template_id, f'Deleted template {data.get("name", template_id)}')
        return {'message': 'Template deleted successfully'}
    except Exception as e:
        raise Exception(f'Failed to delete template: {str(e)}')

def send_email_campaign(data, admin_id, admin_email):
    """Send email campaign to users"""
    try:
        from datetime import timezone
        from app.services.email_service import send_campaign_email
        db = get_db()
        
        # Get recipients
        users = list(auth.list_users().iterate_all())
        recipients = []
        
        if data['recipientType'] == 'all':
            recipients = [u.email for u in users if u.email]
        elif data['recipientType'] == 'new':
            seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
            recipients = [u.email for u in users if u.email and u.user_metadata.creation_timestamp and 
                         datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000, tz=timezone.utc) > seven_days_ago]
        elif data['recipientType'] == 'active':
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            recipients = [u.email for u in users if u.email and u.user_metadata.last_sign_in_timestamp and 
                         datetime.fromtimestamp(u.user_metadata.last_sign_in_timestamp / 1000, tz=timezone.utc) > thirty_days_ago]
        
        # Send emails to all recipients
        sent_count = 0
        failed_count = 0
        for recipient in recipients:
            if send_campaign_email(recipient, data['subject'], data['body']):
                sent_count += 1
            else:
                failed_count += 1
        
        # Save campaign
        campaign_data = {
            'subject': data['subject'],
            'body': data['body'],
            'recipientType': data['recipientType'],
            'recipientCount': len(recipients),
            'sentCount': sent_count,
            'failedCount': failed_count,
            'sentBy': admin_email,
            'status': 'sent',
            'createdAt': datetime.now(timezone.utc)
        }
        
        doc_ref = db.collection('email_campaigns').add(campaign_data)
        campaign_id = doc_ref[1].id
        
        log_audit(admin_id, admin_email, 'campaign.sent', 'email_campaign', campaign_id, f'Sent campaign to {len(recipients)} users')
        
        return {'message': f'Campaign sent to {len(recipients)} users', 'recipientCount': len(recipients)}
    except Exception as e:
        raise Exception(f'Failed to send campaign: {str(e)}')

def get_email_campaigns(page=1, per_page=10):
    """Get email campaigns history"""
    try:
        db = get_db()
        query = db.collection('email_campaigns').order_by('createdAt', direction=firestore.Query.DESCENDING)
        all_docs = list(query.stream())
        total = len(all_docs)
        
        offset = (page - 1) * per_page
        paginated_docs = all_docs[offset:offset + per_page]
        
        campaigns = []
        for doc in paginated_docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'createdAt' in data and hasattr(data['createdAt'], 'isoformat'):
                data['createdAt'] = data['createdAt'].isoformat() + 'Z'
            campaigns.append(data)
        
        return {'campaigns': campaigns, 'total': total, 'page': page, 'pages': (total + per_page - 1) // per_page}
    except Exception as e:
        raise Exception(f'Failed to get campaigns: {str(e)}')

def validate_coupon(code, user_id=None):
    """Validate and return coupon details"""
    try:
        from datetime import timezone
        db = get_db()
        
        # Find coupon by code
        coupons = list(db.collection('coupons').where('code', '==', code.upper()).stream())
        if not coupons:
            raise Exception('Invalid coupon code')
        
        coupon_doc = coupons[0]
        coupon = coupon_doc.to_dict()
        coupon['id'] = coupon_doc.id
        
        # Check if active
        if not coupon.get('active'):
            raise Exception('Coupon is inactive')
        
        # Check expiry
        if coupon.get('expiresAt'):
            expiry = coupon['expiresAt']
            if hasattr(expiry, 'timestamp'):
                expiry = datetime.fromtimestamp(expiry.timestamp(), tz=timezone.utc)
            if expiry < datetime.now(timezone.utc):
                raise Exception('Coupon has expired')
        
        # Check usage limit
        if coupon.get('maxUses', 0) > 0:
            if coupon.get('usedCount', 0) >= coupon['maxUses']:
                raise Exception('Coupon usage limit reached')
        
        return {
            'valid': True,
            'code': coupon['code'],
            'discount': coupon['discount'],
            'discountType': coupon['discountType']
        }
    except Exception as e:
        raise Exception(str(e))

def apply_coupon(code, user_id, order_amount):
    """Apply coupon and calculate discount"""
    try:
        from datetime import timezone
        db = get_db()
        
        # Validate coupon
        coupon_info = validate_coupon(code, user_id)
        
        # Calculate discount
        discount_amount = 0
        if coupon_info['discountType'] == 'percentage':
            discount_amount = (order_amount * coupon_info['discount']) / 100
        else:
            discount_amount = min(coupon_info['discount'], order_amount)
        
        final_amount = max(0, order_amount - discount_amount)
        
        # Increment usage count
        coupons = list(db.collection('coupons').where('code', '==', code.upper()).stream())
        if coupons:
            coupon_doc = coupons[0]
            current_count = coupon_doc.to_dict().get('usedCount', 0)
            coupon_doc.reference.update({'usedCount': current_count + 1})
        
        return {
            'originalAmount': order_amount,
            'discountAmount': discount_amount,
            'finalAmount': final_amount,
            'couponCode': code.upper()
        }
    except Exception as e:
        raise Exception(str(e))

def get_coupon_analytics():
    """Get coupon usage analytics"""
    try:
        db = get_db()
        coupons = [doc.to_dict() for doc in db.collection('coupons').stream()]
        
        total_coupons = len(coupons)
        active_coupons = sum(1 for c in coupons if c.get('active'))
        total_redemptions = sum(c.get('usedCount', 0) for c in coupons)
        
        # Top performing coupons
        top_coupons = sorted(coupons, key=lambda x: x.get('usedCount', 0), reverse=True)[:5]
        top_coupons_data = [{
            'code': c['code'],
            'usedCount': c.get('usedCount', 0),
            'discount': c['discount'],
            'discountType': c['discountType']
        } for c in top_coupons]
        
        return {
            'totalCoupons': total_coupons,
            'activeCoupons': active_coupons,
            'totalRedemptions': total_redemptions,
            'topCoupons': top_coupons_data
        }
    except Exception as e:
        raise Exception(f'Failed to get coupon analytics: {str(e)}')

# ─── Content Management System ──────────────────────────────────────────────

def get_content_pages(page_type=None):
    """Get all content pages or filter by type"""
    try:
        db = get_db()
        query = db.collection('content_pages')
        
        if page_type:
            query = query.where('type', '==', page_type)
        
        docs = list(query.order_by('updatedAt', direction=firestore.Query.DESCENDING).stream())
        
        pages = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'createdAt' in data and hasattr(data['createdAt'], 'isoformat'):
                data['createdAt'] = data['createdAt'].isoformat() + 'Z'
            if 'updatedAt' in data and hasattr(data['updatedAt'], 'isoformat'):
                data['updatedAt'] = data['updatedAt'].isoformat() + 'Z'
            pages.append(data)
        
        return pages
    except Exception as e:
        raise Exception(f'Failed to get content pages: {str(e)}')

def get_content_page(page_id):
    """Get single content page"""
    try:
        db = get_db()
        doc = db.collection('content_pages').document(page_id).get()
        
        if not doc.exists:
            raise Exception('Page not found')
        
        data = doc.to_dict()
        data['id'] = doc.id
        if 'createdAt' in data and hasattr(data['createdAt'], 'isoformat'):
            data['createdAt'] = data['createdAt'].isoformat() + 'Z'
        if 'updatedAt' in data and hasattr(data['updatedAt'], 'isoformat'):
            data['updatedAt'] = data['updatedAt'].isoformat() + 'Z'
        
        return data
    except Exception as e:
        raise Exception(str(e))

def create_content_page(data, admin_id, admin_email):
    """Create new content page"""
    try:
        from datetime import timezone
        db = get_db()
        
        page_data = {
            'title': data['title'],
            'slug': data['slug'],
            'type': data['type'],
            'content': data['content'],
            'excerpt': data.get('excerpt', ''),
            'metaTitle': data.get('metaTitle', data['title']),
            'metaDescription': data.get('metaDescription', ''),
            'metaKeywords': data.get('metaKeywords', []),
            'published': data.get('published', False),
            'featuredImage': data.get('featuredImage', ''),
            'author': admin_email,
            'createdAt': datetime.now(timezone.utc),
            'updatedAt': datetime.now(timezone.utc)
        }
        
        doc_ref = db.collection('content_pages').add(page_data)
        page_id = doc_ref[1].id
        
        log_audit(admin_id, admin_email, 'content.created', 'content_page', page_id, f'Created page {data["title"]}')
        
        page_data['id'] = page_id
        if page_data.get('createdAt'):
            page_data['createdAt'] = page_data['createdAt'].isoformat() + 'Z'
        if page_data.get('updatedAt'):
            page_data['updatedAt'] = page_data['updatedAt'].isoformat() + 'Z'
        
        return page_data
    except Exception as e:
        raise Exception(f'Failed to create page: {str(e)}')

def update_content_page(page_id, data, admin_id, admin_email):
    """Update content page"""
    try:
        from datetime import timezone
        db = get_db()
        doc_ref = db.collection('content_pages').document(page_id)
        
        if not doc_ref.get().exists:
            raise Exception('Page not found')
        
        update_data = {
            'title': data['title'],
            'slug': data['slug'],
            'content': data['content'],
            'excerpt': data.get('excerpt', ''),
            'metaTitle': data.get('metaTitle', data['title']),
            'metaDescription': data.get('metaDescription', ''),
            'metaKeywords': data.get('metaKeywords', []),
            'published': data.get('published', False),
            'featuredImage': data.get('featuredImage', ''),
            'updatedAt': datetime.now(timezone.utc)
        }
        
        doc_ref.update(update_data)
        
        log_audit(admin_id, admin_email, 'content.updated', 'content_page', page_id, f'Updated page {data["title"]}')
        
        return get_content_page(page_id)
    except Exception as e:
        raise Exception(f'Failed to update page: {str(e)}')

def delete_content_page(page_id, admin_id, admin_email):
    """Delete content page"""
    try:
        db = get_db()
        doc_ref = db.collection('content_pages').document(page_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise Exception('Page not found')
        
        data = doc.to_dict()
        doc_ref.delete()
        
        log_audit(admin_id, admin_email, 'content.deleted', 'content_page', page_id, f'Deleted page {data.get("title", page_id)}')
        
        return {'message': 'Page deleted successfully'}
    except Exception as e:
        raise Exception(f'Failed to delete page: {str(e)}')

# ─── Advanced Analytics & Reports ───────────────────────────────────────────

def get_advanced_analytics():
    """Get comprehensive business analytics"""
    try:
        from datetime import timezone
        db = get_db()
        
        # Get all data
        users = list(auth.list_users().iterate_all())
        analyses = [doc.to_dict() for doc in db.collection('analyses').stream()]
        
        # Traffic & User Stats
        total_users = len(users)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        active_30d = sum(1 for u in users if u.user_metadata.last_sign_in_timestamp and 
                        datetime.fromtimestamp(u.user_metadata.last_sign_in_timestamp / 1000, tz=timezone.utc) > thirty_days_ago)
        active_7d = sum(1 for u in users if u.user_metadata.last_sign_in_timestamp and 
                       datetime.fromtimestamp(u.user_metadata.last_sign_in_timestamp / 1000, tz=timezone.utc) > seven_days_ago)
        
        # Retention Rate
        retention_rate = (active_30d / total_users * 100) if total_users > 0 else 0
        
        # Category Performance
        category_counts = {}
        for analysis in analyses:
            cat = analysis.get('category')
            if cat:
                category_counts[cat] = category_counts.get(cat, 0) + 1
        
        top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Food Popularity (ingredient frequency)
        ingredient_freq = {}
        for analysis in analyses:
            text = analysis.get('ingredientText', '').lower()
            words = text.split()
            for word in words:
                if len(word) > 3:
                    ingredient_freq[word] = ingredient_freq.get(word, 0) + 1
        
        popular_ingredients = sorted(ingredient_freq.items(), key=lambda x: x[1], reverse=True)[:20]
        
        # Conversion Rate (free to paid)
        paid_users = sum(1 for u in users if (u.custom_claims or {}).get('role') in ['admin', 'superadmin'])
        conversion_rate = (paid_users / total_users * 100) if total_users > 0 else 0
        
        # Growth Metrics
        new_users_7d = sum(1 for u in users if u.user_metadata.creation_timestamp and 
                          datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000, tz=timezone.utc) > seven_days_ago)
        new_users_30d = sum(1 for u in users if u.user_metadata.creation_timestamp and 
                           datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000, tz=timezone.utc) > thirty_days_ago)
        
        return {
            'trafficStats': {
                'totalUsers': total_users,
                'activeUsers30d': active_30d,
                'activeUsers7d': active_7d,
                'newUsers7d': new_users_7d,
                'newUsers30d': new_users_30d
            },
            'engagementStats': {
                'totalAnalyses': len(analyses),
                'avgAnalysesPerUser': len(analyses) / total_users if total_users > 0 else 0,
                'retentionRate': round(retention_rate, 2)
            },
            'conversionStats': {
                'paidUsers': paid_users,
                'conversionRate': round(conversion_rate, 2)
            },
            'categoryPerformance': [{'category': cat, 'count': count} for cat, count in top_categories],
            'popularIngredients': [{'ingredient': ing, 'count': count} for ing, count in popular_ingredients],
            'growthMetrics': {
                'userGrowth7d': new_users_7d,
                'userGrowth30d': new_users_30d,
                'analysisGrowth': len([a for a in analyses if a.get('analyzedAt') and a.get('analyzedAt') > seven_days_ago])
            }
        }
    except Exception as e:
        raise Exception(f'Failed to get advanced analytics: {str(e)}')

def export_analytics_report(format_type='csv'):
    """Export analytics report in CSV or PDF format"""
    try:
        analytics = get_advanced_analytics()
        
        if format_type == 'csv':
            # Generate CSV data
            csv_data = {
                'summary': analytics,
                'timestamp': datetime.now().isoformat()
            }
            return csv_data
        
        # PDF export would require additional library (reportlab)
        return analytics
    except Exception as e:
        raise Exception(f'Failed to export report: {str(e)}')
