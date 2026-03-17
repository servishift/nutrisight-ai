"""
Graph Intelligence Service
Analyzes ingredient co-occurrence networks using NetworkX
"""
import networkx as nx
from collections import Counter, defaultdict
import re
from app.services.data_loader import FDCDataLoader

class GraphIntelligence:
    def __init__(self):
        self.data_loader = None
        self.graph = None
        self._initialized = False
    
    def _ensure_loader(self):
        """Lazy load data loader"""
        if self.data_loader is None:
            self.data_loader = FDCDataLoader()
    
    def clear_cache(self):
        """Clear cached graph to force rebuild"""
        self.graph = None
        self._initialized = False
        print("Graph intelligence cache cleared")
    
    def _parse_ingredients(self, ingredient_text):
        """Parse ingredient text into list"""
        if not ingredient_text or ingredient_text == 'nan':
            return []
        ingredients = re.split(r'[,;]+', str(ingredient_text))
        cleaned = []
        for i in ingredients:
            # Remove parentheses and extra whitespace
            clean = re.sub(r'[()\[\]]', '', i.strip()).strip().upper()
            if clean and len(clean) > 1:  # Skip single characters
                cleaned.append(clean)
        return cleaned
    
    def build_graph(self, min_cooccurrence=5):
        """Build ingredient co-occurrence graph"""
        if self._initialized:
            return self.graph
        
        try:
            print("Building ingredient co-occurrence graph...")
            self._ensure_loader()
            df = self.data_loader.load_data()
            
            if df is None or len(df) == 0:
                print("No data loaded, skipping graph build")
                self.graph = nx.Graph()
                self._initialized = True
                return self.graph
            
            # Count co-occurrences
            cooccurrence = defaultdict(int)
            ingredient_counts = Counter()
            
            for ingredients_text in df['ingredients']:
                ingredients = self._parse_ingredients(ingredients_text)
                ingredient_counts.update(ingredients)
                
                # Create edges for co-occurring ingredients
                for i in range(len(ingredients)):
                    for j in range(i + 1, len(ingredients)):
                        pair = tuple(sorted([ingredients[i], ingredients[j]]))
                        cooccurrence[pair] += 1
            
            # Build graph
            self.graph = nx.Graph()
            
            # Add nodes with frequency
            for ingredient, count in ingredient_counts.items():
                if count >= min_cooccurrence:
                    self.graph.add_node(ingredient, frequency=count)
            
            # Add edges with weight
            for (ing1, ing2), weight in cooccurrence.items():
                if weight >= min_cooccurrence and ing1 in self.graph and ing2 in self.graph:
                    self.graph.add_edge(ing1, ing2, weight=weight)
            
            self._initialized = True
            print(f"Graph built: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")
            return self.graph
        except Exception as e:
            print(f"Error building graph: {e}")
            self.graph = nx.Graph()
            self._initialized = True
            return self.graph
    
    def get_network_stats(self):
        """Get overall network statistics"""
        if not self._initialized:
            self.build_graph()
        
        if self.graph.number_of_nodes() == 0:
            return {
                'nodeCount': 0,
                'edgeCount': 0,
                'density': 0,
                'avgDegree': 0
            }
        
        return {
            'nodeCount': self.graph.number_of_nodes(),
            'edgeCount': self.graph.number_of_edges(),
            'density': nx.density(self.graph),
            'avgDegree': sum(dict(self.graph.degree()).values()) / self.graph.number_of_nodes()
        }
    
    def get_top_hubs(self, top_n=20):
        """Get ingredients with highest connectivity (degree centrality)"""
        if not self._initialized:
            self.build_graph()
        
        degree_centrality = nx.degree_centrality(self.graph)
        sorted_nodes = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        result = []
        for node, centrality in sorted_nodes:
            result.append({
                'ingredient': node,
                'centrality': round(centrality, 4),
                'connections': self.graph.degree(node),
                'frequency': self.graph.nodes[node]['frequency']
            })
        
        return result
    
    def get_ingredient_neighbors(self, ingredient, top_n=10):
        """Get most frequently co-occurring ingredients"""
        if not self._initialized:
            self.build_graph()
        
        ingredient = ingredient.upper()
        if ingredient not in self.graph:
            return []
        
        neighbors = []
        for neighbor in self.graph.neighbors(ingredient):
            weight = self.graph[ingredient][neighbor]['weight']
            neighbors.append({
                'ingredient': neighbor,
                'cooccurrence': weight,
                'frequency': self.graph.nodes[neighbor]['frequency']
            })
        
        neighbors.sort(key=lambda x: x['cooccurrence'], reverse=True)
        return neighbors[:top_n]
    
    def detect_communities(self, max_communities=10):
        """Detect ingredient communities/clusters"""
        if not self._initialized:
            self.build_graph()
        
        # Use Louvain community detection
        communities = nx.community.louvain_communities(self.graph)
        
        result = []
        for idx, community in enumerate(communities[:max_communities]):
            members = list(community)[:20]  # Top 20 per community
            result.append({
                'communityId': idx,
                'size': len(community),
                'members': members
            })
        
        result.sort(key=lambda x: x['size'], reverse=True)
        return result
    
    def get_additive_network(self):
        """Analyze additive co-occurrence patterns"""
        if not self._initialized:
            self.build_graph()
        
        # Common additive keywords
        additive_keywords = ['SODIUM', 'ACID', 'BENZOATE', 'SORBATE', 'CITRIC', 'PHOSPHATE', 
                            'SULFATE', 'NITRITE', 'BHA', 'BHT', 'TBHQ', 'MSG']
        
        additive_nodes = [node for node in self.graph.nodes() 
                         if any(keyword in node for keyword in additive_keywords)]
        
        # Create subgraph
        subgraph = self.graph.subgraph(additive_nodes)
        
        if subgraph.number_of_nodes() == 0:
            return {'nodes': [], 'edges': [], 'stats': {}}
        
        # Get top connected additives
        degree_cent = nx.degree_centrality(subgraph)
        top_additives = sorted(degree_cent.items(), key=lambda x: x[1], reverse=True)[:15]
        
        nodes = []
        for node, centrality in top_additives:
            nodes.append({
                'id': node,
                'centrality': round(centrality, 4),
                'frequency': self.graph.nodes[node]['frequency']
            })
        
        # Get edges between top additives
        edges = []
        top_node_set = set([n['id'] for n in nodes])
        for u, v, data in subgraph.edges(data=True):
            if u in top_node_set and v in top_node_set:
                edges.append({
                    'source': u,
                    'target': v,
                    'weight': data['weight']
                })
        
        return {
            'nodes': nodes,
            'edges': edges,
            'stats': {
                'totalAdditives': subgraph.number_of_nodes(),
                'connections': subgraph.number_of_edges()
            }
        }

# Singleton instance
graph_intelligence = GraphIntelligence()
