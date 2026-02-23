import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Loader2, Target, Info, Zap } from 'lucide-react';
import { predictBrand } from '@/services/phase3-api';
import type { BrandPredictionResult } from '@/types/phase3';

export default function BrandPredictionPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BrandPredictionResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const handlePredict = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);

    try {
      const data = await predictBrand(trimmed);
      setResult(data);
      setDemoMode(false);
    } catch {
      setResult({
        ingredientText: trimmed,
        modelUsed: 'BERT Multi-class Classifier (demo)',
        inferenceTimeMs: 128,
        predictions: [
          { brand: 'Nestlé', confidence: 0.72 },
          { brand: 'General Mills', confidence: 0.14 },
          { brand: 'Kellogg\'s', confidence: 0.08 },
          { brand: 'Britannia', confidence: 0.04 },
          { brand: 'PepsiCo', confidence: 0.02 },
        ],
      });
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">Phase 3</Badge>
            <Badge variant="outline" className="border-accent/30 text-accent">NLP</Badge>
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            <Brain className="mr-2 inline h-8 w-8 text-primary" />
            Brand Prediction
          </h1>
          <p className="text-muted-foreground">
            Predict the brand owner from ingredients using BERT embeddings &amp; multi-class classification
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ingredient List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Enriched Wheat Flour, Sugar, Palm Oil, Cocoa, Soy Lecithin, Milk Powder..."
                  rows={6}
                  className="resize-none text-sm"
                />
                <Button onClick={handlePredict} disabled={!text.trim() || loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  {loading ? 'Predicting…' : 'Predict Brand'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">How it Works</p>
                    <p className="text-xs text-muted-foreground">
                      BERT embeddings capture semantic patterns. A classifier trained on 10,000+ products maps ingredient signatures to brand owners.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {!result && !loading && (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Enter ingredients to predict the brand owner
                </p>
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {demoMode && (
                  <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-xs text-muted-foreground">
                      Demo mode — Connect backend for real BERT-powered brand prediction.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">
                    Model: <span className="font-medium text-foreground">{result.modelUsed}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">{result.inferenceTimeMs}ms</span>
                </div>

                {/* Top prediction */}
                {result.predictions.length > 0 && (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Top Prediction</p>
                        <p className="font-display text-3xl font-bold text-foreground mb-1">
                          {result.predictions[0].brand}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(result.predictions[0].confidence * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">confidence</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* All predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Predictions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.predictions.map((pred, i) => (
                      <motion.div
                        key={pred.brand}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium text-foreground">{pred.brand}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {Math.round(pred.confidence * 100)}%
                          </span>
                        </div>
                        <Progress value={pred.confidence * 100} className="h-2" />
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
