from flask import Blueprint, jsonify, request
from app.services.graph_intelligence import graph_intelligence

graph_bp = Blueprint('graph', __name__, url_prefix='/api/graph')

@graph_bp.route('/stats', methods=['GET'])
def get_network_stats():
    """Get overall network statistics"""
    try:
        stats = graph_intelligence.get_network_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get stats: {str(e)}'}), 500

@graph_bp.route('/hubs', methods=['GET'])
def get_top_hubs():
    """Get top ingredient hubs"""
    try:
        top_n = request.args.get('limit', default=20, type=int)
        hubs = graph_intelligence.get_top_hubs(top_n)
        return jsonify({'hubs': hubs}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get hubs: {str(e)}'}), 500

@graph_bp.route('/neighbors/<ingredient>', methods=['GET'])
def get_neighbors(ingredient):
    """Get ingredient neighbors"""
    try:
        top_n = request.args.get('limit', default=10, type=int)
        neighbors = graph_intelligence.get_ingredient_neighbors(ingredient, top_n)
        return jsonify({'ingredient': ingredient, 'neighbors': neighbors}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get neighbors: {str(e)}'}), 500

@graph_bp.route('/communities', methods=['GET'])
def get_communities():
    """Get ingredient communities"""
    try:
        max_communities = request.args.get('limit', default=10, type=int)
        communities = graph_intelligence.detect_communities(max_communities)
        return jsonify({'communities': communities}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to detect communities: {str(e)}'}), 500

@graph_bp.route('/additive-network', methods=['GET'])
def get_additive_network():
    """Get additive co-occurrence network"""
    try:
        network = graph_intelligence.get_additive_network()
        return jsonify(network), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get additive network: {str(e)}'}), 500

@graph_bp.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear graph cache and rebuild"""
    try:
        graph_intelligence.clear_cache()
        return jsonify({'message': 'Graph cache cleared successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to clear cache: {str(e)}'}), 500
