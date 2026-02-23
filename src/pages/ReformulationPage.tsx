import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, Loader2, Plus, Minus, ArrowUpDown, Edit, Info, Zap } from 'lucide-react';
import { detectReformulation } from '@/services/phase3-api';
import type { ReformulationResult, ReformulationChange } from '@/types/phase3';

const changeIcons: Record<ReformulationChange['type'], React.ReactNode> = {
  added: <Plus className="h-4 w-4 text-success" />,
  removed: <Minus className="h-4 w-4 text-destructive" />,
  reordered: <ArrowUpDown className="h-4 w-4 text-accent" />,
  modified: <Edit className="h-4 w-4 text-info" />,
};

const impactColors: Record<string, string> = {
  positive: 'border-success/30 bg-success/5 text-success',
  negative: 'border-destructive/30 bg-destructive/5 text-destructive',
  neutral: 'border-border bg-muted/50 text-muted-foreground',
};

export default function ReformulationPage() {
  const [original, setOriginal] = useState('');
  const [updated, setUpdated] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReformulationResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const handleCompare = async () => {
    if (!original.trim() || !updated.trim()) return;
    setLoading(true);

    try {
      const data = await detectReformulation(original.trim(), updated.trim());
      setResult(data);
      setDemoMode(false);
    } catch {
      setResult({
        overallSimilarity: 0.72,
        orderSimilarity: 0.65,
        cosineSimilarity: 0.78,
        originalIngredients: original.split(',').map((s) => s.trim()),
        updatedIngredients: updated.split(',').map((s) => s.trim()),
        summary: 'The product has undergone moderate reformulation. Key changes include removal of artificial colors and addition of natural alternatives.',
        changes: [
          { type: 'removed', ingredient: 'Red 40', details: 'Artificial color removed', impact: 'positive' },
          { type: 'removed', ingredient: 'Yellow 5', details: 'Artificial color removed', impact: 'positive' },
          { type: 'added', ingredient: 'Beet Juice Concentrate', details: 'Natural color alternative added', impact: 'positive' },
          { type: 'added', ingredient: 'Turmeric Extract', details: 'Natural color alternative added', impact: 'positive' },
          { type: 'reordered', ingredient: 'Sugar', details: 'Moved from position 2 to position 4', impact: 'positive' },
          { type: 'modified', ingredient: 'Vegetable Oil', details: 'Changed from "Palm Oil" to "Sunflower Oil"', impact: 'positive' },
        ],
      });
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'text-destructive';
    if (score >= 0.7) return 'text-accent';
    return 'text-success';
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">Phase 3</Badge>
            <Badge variant="outline" className="border-accent/30 text-accent">Enterprise</Badge>
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            <ArrowRightLeft className="mr-2 inline h-8 w-8 text-accent" />
            Reformulation Detection
          </h1>
          <p className="text-muted-foreground">
            Compare two ingredient lists to detect reformulations — additions, removals, reordering &amp; modifications
          </p>
        </div>

        {/* Input */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge className="bg-muted text-muted-foreground">Original</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Paste the original ingredient list..."
                rows={5}
                className="resize-none text-sm"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge className="bg-primary/10 text-primary">Updated</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={updated}
                onChange={(e) => setUpdated(e.target.value)}
                placeholder="Paste the updated ingredient list..."
                rows={5}
                className="resize-none text-sm"
              />
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={handleCompare}
          disabled={!original.trim() || !updated.trim() || loading}
          className="mb-8 w-full gap-2 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
          {loading ? 'Comparing…' : 'Compare Ingredients'}
        </Button>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {demoMode && (
              <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-xs text-muted-foreground">
                  Demo mode — Connect backend for real deep learning reformulation analysis.
                </p>
              </div>
            )}

            {/* Scores */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Overall Similarity', value: result.overallSimilarity },
                { label: 'Order Similarity', value: result.orderSimilarity },
                { label: 'Cosine Similarity', value: result.cosineSimilarity },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className={`text-3xl font-bold ${getSimilarityColor(s.value)}`}>
                      {Math.round(s.value * 100)}%
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detected Changes ({result.changes.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.changes.map((change, i) => (
                  <motion.div
                    key={`${change.type}-${change.ingredient}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${impactColors[change.impact]}`}
                  >
                    <div className="mt-0.5 shrink-0">{changeIcons[change.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{change.ingredient}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{change.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{change.details}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
