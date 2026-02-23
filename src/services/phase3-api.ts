// Phase 3 API service — Deep Learning endpoints

import type {
  SimilarityRequest,
  SimilarityResult,
  BrandPredictionResult,
  ReformulationResult,
  EmbeddingVisualization,
} from '@/types/phase3';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch<T>(path: string, body: unknown): Promise<T> {
  if (!BASE_URL) {
    throw new Error('Backend required: Set VITE_API_BASE_URL to enable Phase 3 features.');
  }
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  return res.json();
}

export async function findSimilarProducts(request: SimilarityRequest): Promise<SimilarityResult> {
  return apiFetch('/api/similar-products', request);
}

export async function predictBrand(ingredientText: string): Promise<BrandPredictionResult> {
  return apiFetch('/api/predict-brand', { ingredientText });
}

export async function detectReformulation(
  originalIngredients: string,
  updatedIngredients: string
): Promise<ReformulationResult> {
  return apiFetch('/api/detect-reformulation', { originalIngredients, updatedIngredients });
}

export async function getEmbeddingVisualization(
  category?: string
): Promise<EmbeddingVisualization[]> {
  return apiFetch('/api/embeddings/visualize', { category });
}
