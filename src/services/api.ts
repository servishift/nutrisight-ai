// API service layer — all backend calls go through here

import type { AnalysisRequest, AnalysisResult } from '@/types/ingredient';
import { detectAllergens } from '@/engine/allergen-engine';
import { detectAdditives } from '@/engine/additive-engine';
import { calculateHealthRisk } from '@/engine/health-risk-engine';
import { parseIngredients, calculateIngredientStats, calculateCleanLabelScore } from '@/engine/ingredient-processor';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeaders(): HeadersInit {
  const tokens = localStorage.getItem('foodintel_auth_tokens');
  const parsed = tokens ? JSON.parse(tokens) : null;
  return {
    'Content-Type': 'application/json',
    ...(parsed?.accessToken ? { Authorization: `Bearer ${parsed.accessToken}` } : {}),
  };
}

/**
 * Analyze ingredients — uses local engine if no backend configured,
 * switches to API automatically when VITE_API_BASE_URL is set.
 */
export async function analyzeIngredients(request: AnalysisRequest): Promise<AnalysisResult> {
  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
