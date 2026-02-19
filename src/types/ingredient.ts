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

export interface Additive {
  name: string;
  type: 'preservative' | 'color' | 'flavor' | 'sweetener' | 'emulsifier' | 'stabilizer' | 'antioxidant';
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  matchedKeywords: string[];
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

export interface HealthRiskFactor {
  ingredient: string;
  impact: 'positive' | 'negative' | 'caution' | 'neutral';
  points: number;
  reason: string;
}

export interface HealthRiskBreakdown {
  score: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  factors: HealthRiskFactor[];
  additiveCount: number;
}

export interface AnalysisResult {
  allergens: Allergen[];
  additives: Additive[];
  category: CategoryPrediction | null;
  ingredientCount: number;
  ingredients: string[];
  topIngredients: IngredientStat[];
  cleanLabelScore: number | null;
  healthRisk: HealthRiskBreakdown | null;
  analyzedAt: string;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'complete' | 'error';
