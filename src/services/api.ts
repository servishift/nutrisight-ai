// API service layer — all backend calls go through here
// When backend (FastAPI) is connected, just update BASE_URL and remove client-side fallbacks

import type { AnalysisRequest, AnalysisResult } from '@/types/ingredient';
import { detectAllergens } from '@/engine/allergen-engine';
import { parseIngredients, calculateIngredientStats, calculateCleanLabelScore } from '@/engine/ingredient-processor';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Analyze ingredients — uses local engine if no backend configured,
 * switches to API automatically when VITE_API_BASE_URL is set.
 */
export async function analyzeIngredients(request: AnalysisRequest): Promise<AnalysisResult> {
  // If backend is configured, use API
  if (BASE_URL) {
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  // Client-side analysis (Phase 1 — real logic, not mock data)
  return runLocalAnalysis(request.ingredientText);
}

function runLocalAnalysis(ingredientText: string): AnalysisResult {
  const ingredients = parseIngredients(ingredientText);
  const allergens = detectAllergens(ingredientText);
  const topIngredients = calculateIngredientStats(ingredients);
  const cleanLabelScore = calculateCleanLabelScore(ingredients);

  return {
    allergens,
    category: null, // Requires ML model — available after backend integration
    ingredientCount: ingredients.length,
    ingredients,
    topIngredients: topIngredients.slice(0, 10),
    cleanLabelScore,
    analyzedAt: new Date().toISOString(),
  };
}

// API endpoint documentation for the planned backend
export const API_ENDPOINTS = [
  {
    method: 'POST' as const,
    path: '/api/analyze',
    description: 'Full ingredient analysis — allergens, category, score',
    requestBody: '{ "ingredientText": "string" }',
    responseBody: 'AnalysisResult',
    status: 'available' as const,
  },
  {
    method: 'POST' as const,
    path: '/api/detect-allergens',
    description: 'Detect allergens from ingredient text',
    requestBody: '{ "ingredientText": "string" }',
    responseBody: '{ "allergens": Allergen[] }',
    status: 'available' as const,
  },
  {
    method: 'POST' as const,
    path: '/api/predict-category',
    description: 'Predict food category using ML model (TF-IDF + LogReg)',
    requestBody: '{ "ingredientText": "string" }',
    responseBody: '{ "category": string, "confidence": number }',
    status: 'planned' as const,
  },
  {
    method: 'POST' as const,
    path: '/api/calculate-score',
    description: 'Calculate clean label and health risk scores',
    requestBody: '{ "ingredientText": "string" }',
    responseBody: '{ "cleanLabelScore": number, "healthRiskScore": number }',
    status: 'available' as const,
  },
  {
    method: 'POST' as const,
    path: '/api/get-similar-products',
    description: 'Find similar products using ingredient embeddings',
    requestBody: '{ "ingredientText": "string", "topK": number }',
    responseBody: '{ "products": SimilarProduct[] }',
    status: 'planned' as const,
  },
  {
    method: 'GET' as const,
    path: '/api/additives',
    description: 'Get full additive knowledge base',
    requestBody: undefined,
    responseBody: '{ "additives": Additive[] }',
    status: 'planned' as const,
  },
];
