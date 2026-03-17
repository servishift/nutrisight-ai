from flask import Blueprint, request, jsonify
from app.services.additive_engine import (
    get_all_additives,
    get_additives_by_type,
    get_additive_stats
)

additive_bp = Blueprint('additives', __name__, url_prefix='/api/additives')

@additive_bp.route('/', methods=['GET'])
def get_additives():
    """Get all additives or filter by type"""
    additive_type = request.args.get('type', 'all')
    search = request.args.get('search', '').lower()
    
    additives = get_additives_by_type(additive_type)
    
    # Apply search filter
    if search:
        additives = [a for a in additives if search in a['name'].lower()]
    
    # Format for frontend
    formatted = [{
        'id': f"{a['code']}-{idx}" if a.get('code') else f"add-{idx}",
        'name': a['name'],
        'code': a.get('code', ''),
        'type': a['type'],
        'riskLevel': a['risk'],
        'description': a.get('description', ''),
        'frequency': a.get('frequency', 0)
    } for idx, a in enumerate(additives)]
    
    return jsonify(formatted), 200

@additive_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get additive statistics"""
    stats = get_additive_stats()
    return jsonify(stats), 200

@additive_bp.route('/types', methods=['GET'])
def get_types():
    """Get all additive types"""
    additives = get_all_additives()
    types = list(set(a['type'] for a in additives))
    return jsonify({'types': sorted(types)}), 200
