import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { SubscriptionGate } from '@/components/subscription/SubscriptionGate';
import IngredientInput from '@/components/analyzer/IngredientInput';
import AllergenResults from '@/components/analyzer/AllergenResults';
import ScoreCard from '@/components/analyzer/ScoreCard';
import IngredientStats from '@/components/analyzer/IngredientStats';
import CategoryResult from '@/components/analyzer/CategoryResult';
import ScoreBreakdown from '@/components/analyzer/ScoreBreakdown';
import ExplainabilityCard from '@/components/analyzer/ExplainabilityCard';
import AdditiveResults from '@/components/analyzer/AdditiveResults';
import HealthRiskCard from '@/components/analyzer/HealthRiskCard';
import { useRegion } from '@/contexts/RegionContext';
import { detectFoodOrigin, getValidationMessage } from '@/utils/foodOriginDetector';
import { analyzeIngredients } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AnalysisResult, AnalysisStatus } from '@/types/ingredient';

export default function Analyzer() {
  const { isAuthenticated } = useAuth();
  const { region, isIndian } = useRegion();
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ingredientText, setIngredientText] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  
  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${base}/api/admin/settings/public`);
      if (response.ok) {
        const data = await response.json();
        setIsReadOnly(data.maintenanceMode === 'partial');
      }
    } catch {
      // silently ignore
    }
  };

  const handleAnalyze = async (text: string) => {
    setIngredientText(text);
    setStatus('analyzing');
    setError(null);
    
    // Validate food origin
    const warning = getValidationMessage(text, region);
    setValidationWarning(warning);
    
    try {
      if (region === 'indian') {
        // Call Indian API
        const response = await fetch(`/api/indian/search?q=${encodeURIComponent(text)}&limit=1`);
        if (!response.ok) throw new Error('Indian food search failed');
        const searchData = await response.json();
        
        if (searchData.results && searchData.results.length > 0) {
          const food = searchData.results[0];
          setResult({
            ingredientCount: 1,
            cleanLabelScore: Math.round((food.protein_g / food.energy_kcal) * 100) || 75,
            allergens: [],
            additives: [],
            topIngredients: [{ name: food.food_name, count: 1 }],
            category: food.category || 'Unknown',
            cleanLabelBreakdown: [
              { factor: 'Calories', impact: food.energy_kcal, description: `${food.energy_kcal} kcal` },
              { factor: 'Protein', impact: food.protein_g, description: `${food.protein_g}g` },
              { factor: 'Carbs', impact: food.carb_g, description: `${food.carb_g}g` },
              { factor: 'Fat', impact: food.fat_g, description: `${food.fat_g}g` }
            ]
          });
        } else {
          throw new Error('No Indian food found matching your search');
        }
      } else {
        // Call Global API
        const data = await analyzeIngredients({ ingredientText: text });
        setResult(data);
      }
      setStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStatus('error');
    }
  };

  const handlePredictCategory = async () => {
    if (!result || !ingredientText) return;
    setResult(prev => prev ? { ...prev, category: null } : prev);
    setExplanation(null);
    setIsPredicting(true);
    try {
      const response = await fetch(`/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientText }),
      });
      if (!response.ok) throw new Error('Prediction failed');
      const data = await response.json();
      setResult(prev => prev ? { ...prev, category: data.category } : data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleExplainPrediction = async () => {
    if (!ingredientText) return;
    setIsExplaining(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${base}/api/explain/prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientText, topN: 10 }),
      });
      if (!response.ok) throw new Error('Explanation failed');
      const data = await response.json();
      setExplanation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Explanation failed');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <PageLayout>
      <SubscriptionGate feature="ingredient_analysis">
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <div className="mb-4">
            <h1 className={`mb-2 font-display text-3xl font-bold ${isIndian ? 'text-orange-600' : 'text-foreground'}`}>
              {isIndian ? '🇮🇳 Indian Food Analyzer' : 'Ingredient Analyzer'}
            </h1>
            <p className="text-muted-foreground">
              {isIndian 
                ? 'Search 1,014 Indian foods with AI-powered nutrition analysis'
                : 'Paste an ingredient list to get instant allergen detection, additive analysis, and health scoring'
              }
            </p>
          </div>
          {!isAuthenticated && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Free users:</span> Basic analysis available. 
                <span className="font-medium text-foreground">Sign in</span> to unlock category prediction, AI explainability, and advanced features.
              </p>
            </div>
          )}
          {isReadOnly && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Read-Only Mode:</span> Platform is under maintenance. Analysis is temporarily disabled.
              </p>
            </div>
          )}
          {validationWarning && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Database Mismatch:</span> {validationWarning}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Input panel */}
          <div className="lg:col-span-2">
            {isIndian ? (
              <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-green-50 p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-4">🔍 Search Indian Food</h3>
                <input
                  type="text"
                  placeholder="e.g. paneer, dal makhani, biryani, samosa..."
                  className="w-full px-4 py-3 rounded-lg border border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none mb-4"
                  value={ingredientText}
                  onChange={(e) => setIngredientText(e.target.value)}
                  disabled={isReadOnly}
                />
                <button
                  onClick={() => handleAnalyze(ingredientText)}
                  disabled={!ingredientText || status === 'analyzing' || isReadOnly}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {status === 'analyzing' ? '🔄 Searching...' : '🔍 Search Food'}
                </button>
                <div className="mt-4 text-sm text-orange-700 bg-orange-100 p-3 rounded-lg">
                  <strong>💡 Tip:</strong> Search by food name (e.g., "paneer tikka", "dal", "biryani")
                </div>
              </div>
            ) : (
              <IngredientInput onAnalyze={handleAnalyze} status={status} isReadOnly={isReadOnly} />
            )}
          </div>

          {/* Results panel */}
          <div className="lg:col-span-3">
            {status === 'idle' && (
              <div className={`flex h-full items-center justify-center rounded-lg border border-dashed p-12 text-center ${
                isIndian ? 'border-orange-300 bg-orange-50/30' : 'border-border'
              }`}>
                <p className={`text-sm ${
                  isIndian ? 'text-orange-600' : 'text-muted-foreground'
                }`}>
                  {isIndian ? '🇮🇳 Search for Indian food to see nutrition analysis' : 'Enter ingredients to see analysis results'}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {result && status === 'complete' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                {isIndian ? (
                  // Indian-themed results - Modern & Detailed
                  <>
                    {/* Header Card */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <h2 className="text-2xl font-bold mb-1 truncate">{result.topIngredients?.[0]?.name || ingredientText}</h2>
                          <p className="text-orange-100 text-sm">Indian Food Database • Anuvaad INDB 2024</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex-shrink-0">
                          <div className="text-3xl font-bold">{Math.round(result.cleanLabelBreakdown?.[0]?.impact || 0)}</div>
                          <div className="text-xs text-orange-100">kcal</div>
                        </div>
                      </div>
                    </div>

                    {/* Macronutrients Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {result.cleanLabelBreakdown?.slice(1).map((item, idx) => {
                        const colors = [
                          { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🥩' },
                          { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '🌾' },
                          { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🥑' }
                        ];
                        const color = colors[idx] || colors[0];
                        return (
                          <div key={idx} className={`${color.bg} border-2 ${color.border} rounded-xl p-4 text-center`}>
                            <div className="text-2xl mb-1">{color.icon}</div>
                            <div className={`text-xs font-medium ${color.text} mb-1`}>{item.factor}</div>
                            <div className={`text-xl font-bold ${color.text} break-words`}>{parseFloat(item.impact).toFixed(1)}g</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Category & Health Score */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-orange-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🏷️</span>
                          <h3 className="font-semibold text-gray-700">Category</h3>
                        </div>
                        <div className="text-lg font-bold text-orange-600 break-words">{result.category}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">💚</span>
                          <h3 className="font-semibold text-gray-700">Health Score</h3>
                        </div>
                        <div className="text-xl font-bold text-green-600">{result.cleanLabelScore}/100</div>
                      </div>
                    </div>

                    {/* Nutritional Breakdown */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📊</span> Detailed Nutrition Analysis
                      </h3>
                      <div className="space-y-3">
                        {result.cleanLabelBreakdown?.map((item, idx) => {
                          const value = parseFloat(item.impact);
                          const maxValue = parseFloat(result.cleanLabelBreakdown?.[0]?.impact || 1);
                          const percentage = idx === 0 ? 100 : Math.min((value / maxValue) * 100, 100);
                          const colors = ['bg-orange-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];
                          const unit = idx === 0 ? 'kcal' : 'g';
                          return (
                            <div key={idx}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">{item.factor}</span>
                                <span className="font-bold text-gray-900">{value.toFixed(1)} {unit}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${colors[idx % colors.length]} h-2 rounded-full transition-all duration-500`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Facts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                        <div className="text-3xl mb-2">⚡</div>
                        <div className="text-sm text-gray-600 mb-1">Energy Density</div>
                        <div className="text-lg font-bold text-purple-700">
                          {((result.cleanLabelBreakdown?.[0]?.impact || 0) / 100).toFixed(1)} kcal/g
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-5">
                        <div className="text-3xl mb-2">🎯</div>
                        <div className="text-sm text-gray-600 mb-1">Protein Ratio</div>
                        <div className="text-lg font-bold text-cyan-700">
                          {(((result.cleanLabelBreakdown?.[1]?.impact || 0) / (result.cleanLabelBreakdown?.[0]?.impact || 1)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Global results
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ScoreCard score={result.cleanLabelScore} ingredientCount={result.ingredientCount} />
                      {result.healthRisk && <HealthRiskCard healthRisk={result.healthRisk} />}
                    </div>
                    <AllergenResults allergens={result.allergens} />
                    <AdditiveResults additives={result.additives} />
                    {result.cleanLabelBreakdown && result.cleanLabelBreakdown.length > 0 && (
                      <ScoreBreakdown breakdown={result.cleanLabelBreakdown} title="Clean Label Score Breakdown" />
                    )}
                    {result.healthRisk?.factors && result.healthRisk.factors.length > 0 && (
                      <ScoreBreakdown breakdown={result.healthRisk.factors} title="Health Risk Factors" />
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <IngredientStats stats={result.topIngredients} />
                      <CategoryResult 
                        category={result.category} 
                        ingredientText={ingredientText}
                        onPredict={handlePredictCategory}
                        isLoading={isPredicting}
                      />
                    </div>
                    {(result.category || !isAuthenticated) && (
                      <ExplainabilityCard
                        contributions={explanation?.topContributions || null}
                        predictedCategory={explanation?.predictedCategory || null}
                        onExplain={handleExplainPrediction}
                        isLoading={isExplaining}
                      />
                    )}
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
      </SubscriptionGate>
    </PageLayout>
  );
}
