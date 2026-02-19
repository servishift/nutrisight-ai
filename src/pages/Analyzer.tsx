import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import IngredientInput from '@/components/analyzer/IngredientInput';
import AllergenResults from '@/components/analyzer/AllergenResults';
import ScoreCard from '@/components/analyzer/ScoreCard';
import IngredientStats from '@/components/analyzer/IngredientStats';
import CategoryResult from '@/components/analyzer/CategoryResult';
import AdditiveResults from '@/components/analyzer/AdditiveResults';
import HealthRiskCard from '@/components/analyzer/HealthRiskCard';
import { analyzeIngredients } from '@/services/api';
import type { AnalysisResult, AnalysisStatus } from '@/types/ingredient';

export default function Analyzer() {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (text: string) => {
    setStatus('analyzing');
    setError(null);
    try {
      const data = await analyzeIngredients({ ingredientText: text });
      setResult(data);
      setStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStatus('error');
    }
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Ingredient Analyzer
          </h1>
          <p className="text-muted-foreground">
            Paste an ingredient list to get instant allergen detection, additive analysis, and health scoring
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Input panel */}
          <div className="lg:col-span-2">
            <IngredientInput onAnalyze={handleAnalyze} status={status} />
          </div>

          {/* Results panel */}
          <div className="lg:col-span-3">
            {status === 'idle' && (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Enter ingredients to see analysis results
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <ScoreCard score={result.cleanLabelScore} ingredientCount={result.ingredientCount} />
                  {result.healthRisk && <HealthRiskCard healthRisk={result.healthRisk} />}
                </div>
                <AllergenResults allergens={result.allergens} />
                <AdditiveResults additives={result.additives} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <IngredientStats stats={result.topIngredients} />
                  <CategoryResult category={result.category} />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
