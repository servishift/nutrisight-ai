// API service layer — all backend calls go through here

import type { AnalysisRequest, AnalysisResult } from '@/types/ingredient';
import { detectAllergens } from '@/engine/allergen-engine';
import { detectAdditives } from '@/engine/additive-engine';
import { calculateHealthRisk } from '@/engine/health-risk-engine';
import { parseIngredients, calculateIngredientStats, calculateCleanLabelScore } from '@/engine/ingredient-processor';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Analyze ingredients — uses local engine if no backend configured,
 * switches to API automatically when VITE_API_BASE_URL is set.
 */
export async function analyzeIngredients(request: AnalysisRequest): Promise<AnalysisResult> {
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

  return runLocalAnalysis(request.ingredientText);
}

function runLocalAnalysis(ingredientText: string): AnalysisResult {
  const ingredients = parseIngredients(ingredientText);
  const allergens = detectAllergens(ingredientText);
  const additives = detectAdditives(ingredientText);
  const topIngredients = calculateIngredientStats(ingredients);
  const cleanLabelScore = calculateCleanLabelScore(ingredients);
  const healthRisk = calculateHealthRisk(ingredients, additives);

  return {
    allergens,
    additives,
    category: null,
    ingredientCount: ingredients.length,
    ingredients,
    topIngredients: topIngredients.slice(0, 10),
    cleanLabelScore,
    healthRisk,
    analyzedAt: new Date().toISOString(),
  };
}
