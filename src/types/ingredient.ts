// Core types for FoodIntel AI

export interface AnalysisRequest {
  ingredientText: string;
}

export interface Allergen {
  name: string;
  keywords: string[];
  detected: boolean;
  matchedKeywords: string[];
  severity: 'high' | 'medium' | 'low';
}

export interface IngredientStat {
  name: string;
  count: number;
  percentage: number;
}

export interface CategoryPrediction {
  category: string;
  confidence: number;
}

export interface AnalysisResult {
  allergens: Allergen[];
  category: CategoryPrediction | null;
  ingredientCount: number;
  ingredients: string[];
  topIngredients: IngredientStat[];
  cleanLabelScore: number | null;
  analyzedAt: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
  status: 'available' | 'planned';
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'complete' | 'error';
