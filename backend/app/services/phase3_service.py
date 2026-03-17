"""
Phase 3 ML Service: Similarity Search & Brand Prediction (TF-IDF version)
"""

import pickle
import re
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity

# Additives / ultra-processed markers that lower the clean-label score
_DIRTY_MARKERS = re.compile(
    r'\b(artificial|color|colour|dye|red \d+|yellow \d+|blue \d+|'
    r'high fructose|hydrogenated|partially hydrogenated|'
    r'sodium nitrite|sodium nitrate|bha|bht|tbhq|'
    r'monosodium glutamate|msg|aspartame|sucralose|acesulfame|'
    r'carrageenan|polysorbate|sodium benzoate|potassium bromate)\b',
    re.IGNORECASE
)

def _clean_label_score(ingredients_text: str) -> int:
    """Deterministic 0-100 score: penalise known ultra-processed markers."""
    if not ingredients_text:
        return 50
    hits = len(_DIRTY_MARKERS.findall(ingredients_text))
    score = max(10, 95 - hits * 12)
    return min(score, 95)

MODEL_DIR = Path(__file__).parent.parent.parent / 'models'

class Phase3MLService:
    def __init__(self):
        self.similarity_data = None
        self.brand_data = None
        self._load_models()
    
    def _load_models(self):
        """Load TF-IDF models"""
        try:
            with open(MODEL_DIR / 'similarity_tfidf.pkl', 'rb') as f:
                self.similarity_data = pickle.load(f)
            
            with open(MODEL_DIR / 'brand_prediction_tfidf.pkl', 'rb') as f:
                self.brand_data = pickle.load(f)
            
            print("Phase 3 models loaded")
        except Exception as e:
            print(f"Models not found: {e}")
            print("  Run: python ml/train_phase3_simple.py")
    
    def similarity_search(self, ingredients: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Find similar products"""
        if not self.similarity_data:
            raise ValueError("Models not loaded")
        
        vectorizer = self.similarity_data['vectorizer']
        tfidf_matrix = self.similarity_data['tfidf_matrix']
        
        query_vec = vectorizer.transform([ingredients])
        similarities = cosine_similarity(query_vec, tfidf_matrix)[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append({
                'id': str(self.similarity_data['fdc_ids'][idx]),
                'productName': self.similarity_data['descriptions'][idx],
                'brandOwner': self.similarity_data['brands'][idx],
                'category': self.similarity_data['categories'][idx],
                'ingredients': self.similarity_data['ingredients'][idx],
                'similarityScore': float(similarities[idx]),
                'cleanLabelScore': _clean_label_score(self.similarity_data['ingredients'][idx]),
                'dataSource': 'USDA FoodData Central',
                'fdcUrl': f'https://fdc.nal.usda.gov/fdc-app.html#/food-details/{self.similarity_data["fdc_ids"][idx]}/nutrients',
                'verified': True
            })
        
        return results
    
    def predict_brand(self, ingredients: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Predict brand"""
        if not self.brand_data:
            raise ValueError("Models not loaded")
        
        vectorizer = self.similarity_data['vectorizer']
        model = self.brand_data['model']
        encoder = self.brand_data['encoder']
        
        query_vec = vectorizer.transform([ingredients])
        probabilities = model.predict_proba(query_vec)[0]
        top_indices = np.argsort(probabilities)[-top_k:][::-1]
        
        predictions = []
        for idx in top_indices:
            predictions.append({
                'brand': encoder.inverse_transform([idx])[0],
                'confidence': float(probabilities[idx])
            })
        
        return predictions
    
    def detect_reformulation(self, original: str, updated: str) -> Dict[str, Any]:
        """Detect reformulation changes"""
        if not self.similarity_data:
            raise ValueError("Models not loaded")
        
        vectorizer = self.similarity_data['vectorizer']
        
        # Parse ingredients
        orig_list = [i.strip() for i in original.split(',')]
        upd_list = [i.strip() for i in updated.split(',')]
        
        # Get embeddings
        orig_vec = vectorizer.transform([original])
        upd_vec = vectorizer.transform([updated])
        
        # Calculate similarities
        cosine_sim = float(cosine_similarity(orig_vec, upd_vec)[0][0])
        
        # Calculate order similarity (Jaccard)
        orig_set = set(i.lower() for i in orig_list)
        upd_set = set(i.lower() for i in upd_list)
        intersection = len(orig_set & upd_set)
        union = len(orig_set | upd_set)
        jaccard_sim = intersection / union if union > 0 else 0
        
        # Overall similarity
        overall_sim = (cosine_sim + jaccard_sim) / 2
        
        # Detect changes
        added = list(upd_set - orig_set)
        removed = list(orig_set - upd_set)
        
        # Detect reordering
        common = orig_set & upd_set
        orig_order = {ing.lower(): i for i, ing in enumerate(orig_list) if ing.lower() in common}
        upd_order = {ing.lower(): i for i, ing in enumerate(upd_list) if ing.lower() in common}
        reordered = [ing for ing in common if orig_order.get(ing) != upd_order.get(ing)]
        
        # Build changes list
        changes = []
        
        for ing in removed:
            changes.append({
                'type': 'removed',
                'ingredient': ing.title(),
                'details': 'Ingredient removed from formulation',
                'impact': 'positive' if any(x in ing.lower() for x in ['artificial', 'color', 'red', 'yellow', 'preservative']) else 'neutral'
            })
        
        for ing in added:
            changes.append({
                'type': 'added',
                'ingredient': ing.title(),
                'details': 'New ingredient added',
                'impact': 'positive' if any(x in ing.lower() for x in ['natural', 'organic', 'extract', 'juice']) else 'neutral'
            })
        
        for ing in reordered[:5]:  # Limit to top 5
            orig_pos = orig_order.get(ing, 0)
            upd_pos = upd_order.get(ing, 0)
            changes.append({
                'type': 'reordered',
                'ingredient': ing.title(),
                'details': f'Moved from position {orig_pos + 1} to {upd_pos + 1}',
                'impact': 'positive' if upd_pos > orig_pos and any(x in ing.lower() for x in ['sugar', 'salt', 'oil']) else 'neutral'
            })
        
        # Generate summary
        if overall_sim > 0.9:
            summary = 'Minimal reformulation detected. The product formulation remains largely unchanged with only minor adjustments.'
        elif overall_sim > 0.7:
            summary = f'Moderate reformulation detected. {len(added)} ingredients added, {len(removed)} removed, and {len(reordered)} reordered.'
        else:
            summary = f'Significant reformulation detected. Major changes include {len(added)} new ingredients and {len(removed)} removed ingredients.'
        
        return {
            'overallSimilarity': overall_sim,
            'orderSimilarity': jaccard_sim,
            'cosineSimilarity': cosine_sim,
            'originalIngredients': orig_list,
            'updatedIngredients': upd_list,
            'changes': changes,
            'summary': summary
        }
    
    def get_embeddings_visualization(self, category: str = None) -> List[Dict[str, Any]]:
        """Get embeddings for visualization (Production optimized)"""
        if not self.similarity_data:
            raise ValueError("Models not loaded")
        
        from sklearn.decomposition import PCA
        import time
        
        start_time = time.time()
        
        # Get data
        tfidf_matrix = self.similarity_data['tfidf_matrix']
        descriptions = self.similarity_data['descriptions']
        categories = self.similarity_data['categories']
        fdc_ids = self.similarity_data['fdc_ids']
        
        # Filter by category if specified
        if category and category != 'All':
            # Case-insensitive partial match
            indices = [i for i, cat in enumerate(categories) 
                      if cat and category.lower() in str(cat).lower()]
            if not indices:
                # Return empty if no matches
                return []
            tfidf_subset = tfidf_matrix[indices]
            desc_subset = [descriptions[i] for i in indices]
            cat_subset = [categories[i] for i in indices]
            id_subset = [fdc_ids[i] for i in indices]
        else:
            # Sample for performance (max 500 products)
            sample_size = min(500, tfidf_matrix.shape[0])
            indices = np.random.choice(tfidf_matrix.shape[0], sample_size, replace=False)
            tfidf_subset = tfidf_matrix[indices]
            desc_subset = [descriptions[i] for i in indices]
            cat_subset = [categories[i] for i in indices]
            id_subset = [fdc_ids[i] for i in indices]
        
        # Need at least 2 samples for PCA
        if len(desc_subset) < 2:
            return []
        
        # Reduce to 2D using PCA (faster than t-SNE)
        pca = PCA(n_components=2, random_state=42)
        embeddings_2d = pca.fit_transform(tfidf_subset.toarray())
        
        # Normalize coordinates to 0-100 range for better visualization
        x_min, x_max = embeddings_2d[:, 0].min(), embeddings_2d[:, 0].max()
        y_min, y_max = embeddings_2d[:, 1].min(), embeddings_2d[:, 1].max()
        
        # Avoid division by zero
        if x_max - x_min > 0:
            embeddings_2d[:, 0] = (embeddings_2d[:, 0] - x_min) / (x_max - x_min) * 100
        if y_max - y_min > 0:
            embeddings_2d[:, 1] = (embeddings_2d[:, 1] - y_min) / (y_max - y_min) * 100
        
        # Simple clustering based on coordinates
        from sklearn.cluster import KMeans
        n_clusters = min(8, len(embeddings_2d))
        if n_clusters > 1:
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            clusters = kmeans.fit_predict(embeddings_2d)
        else:
            clusters = np.zeros(len(embeddings_2d), dtype=int)
        
        # Create visualization data
        results = []
        for i, (x, y) in enumerate(embeddings_2d):
            results.append({
                'id': str(id_subset[i]),
                'name': desc_subset[i][:60] if desc_subset[i] else 'Unknown Product',
                'productName': desc_subset[i][:60] if desc_subset[i] else 'Unknown Product',
                'category': cat_subset[i] if cat_subset[i] else 'Uncategorized',
                'x': float(x),
                'y': float(y),
                'cluster': int(clusters[i])
            })
        
        elapsed = time.time() - start_time
        print(f"Generated {len(results)} embeddings for '{category or 'All'}' in {elapsed:.2f}s")
        
        return results

phase3_service = Phase3MLService()
