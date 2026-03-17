// Phase 3 API service — Deep Learning endpoints

import type {
  SimilarityRequest,
  SimilarityResult,
  BrandPredictionResult,
  ReformulationResult,
  EmbeddingVisualization,
} from '@/types/phase3';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch<T>(path: string, body: unknown, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const tokens = JSON.parse(localStorage.getItem('foodintel_auth_tokens') || 'null');
      const token = tokens?.accessToken;
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        // Retry on 503 (service unavailable - models loading)
        if (res.status === 503 && i < retries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        const err = await res.json().catch(() => ({ message: `Error ${res.status}` }));
        throw new Error(err.message || `API error: ${res.status}`);
      }
      return res.json();
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function findSimilarProducts(request: SimilarityRequest): Promise<SimilarityResult> {
  const data = await apiFetch<any>('/api/phase3/similarity', {
    ingredients: request.ingredientText,
    topK: request.topK || 10
  });
  
  return {
    query: data.query,
    modelUsed: 'TF-IDF Similarity',
    searchTimeMs: 50,
    results: data.results
  };
}

export async function predictBrand(ingredientText: string): Promise<BrandPredictionResult> {
  const data = await apiFetch<BrandPredictionResult>('/api/phase3/brand-prediction', {
    ingredients: ingredientText,
    topK: 5
  });
  
  return data;
}

export async function detectReformulation(
  originalIngredients: string,
  updatedIngredients: string
): Promise<ReformulationResult> {
  const data = await apiFetch<ReformulationResult>('/api/phase3/reformulation', {
    originalIngredients,
    updatedIngredients
  });
  
  return data;
}

export async function getEmbeddingVisualization(
  category?: string
): Promise<EmbeddingVisualization[]> {
  const data = await apiFetch<any>('/api/phase3/embeddings', { category });
  return data.embeddings;
}
