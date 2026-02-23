// Phase 3 — Deep Learning types

export interface ProductEmbedding {
  id: string;
  productName: string;
  brandOwner: string;
  ingredients: string;
  embeddingVector: number[];
  category: string;
  createdAt: string;
}

export interface SimilarProduct {
  id: string;
  productName: string;
  brandOwner: string;
  category: string;
  similarityScore: number;
  ingredients: string;
  cleanLabelScore: number | null;
}

export interface SimilarityRequest {
  ingredientText: string;
  topK?: number;
}

export interface SimilarityResult {
  query: string;
  results: SimilarProduct[];
  modelUsed: string;
  searchTimeMs: number;
}

export interface BrandPrediction {
  brand: string;
  confidence: number;
}

export interface BrandPredictionResult {
  predictions: BrandPrediction[];
  ingredientText: string;
  modelUsed: string;
  inferenceTimeMs: number;
}

export interface ReformulationChange {
  type: 'added' | 'removed' | 'reordered' | 'modified';
  ingredient: string;
  details: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ReformulationResult {
  overallSimilarity: number;
  orderSimilarity: number;
  cosineSimilarity: number;
  changes: ReformulationChange[];
  summary: string;
  originalIngredients: string[];
  updatedIngredients: string[];
}

export interface EmbeddingVisualization {
  id: string;
  productName: string;
  x: number;
  y: number;
  category: string;
  cluster: number;
}
