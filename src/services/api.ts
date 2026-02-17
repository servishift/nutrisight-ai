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

// API endpoint documentation moved to docs/API_REFERENCE.md
// See docs/ folder for complete backend integration guide