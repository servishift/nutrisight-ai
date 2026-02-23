import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Sparkles, ArrowRight, Zap, Info } from 'lucide-react';
import { findSimilarProducts } from '@/services/phase3-api';
import type { SimilarityResult } from '@/types/phase3';
import { Slider } from '@/components/ui/slider';

export default function SimilaritySearchPage() {
  const [text, setText] = useState('');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimilarityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const handleSearch = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    try {
      const data = await findSimilarProducts({ ingredientText: trimmed, topK });
      setResult(data);
      setDemoMode(false);
    } catch (err) {
      // Show demo data if backend not connected
      setResult({
        query: trimmed,
        modelUsed: 'Sentence-BERT (demo)',
        searchTimeMs: 42,
        results: [
          { id: '1', productName: 'Organic Wheat Crackers', brandOwner: 'Nature Valley', category: 'Snacks', similarityScore: 0.94, ingredients: 'Whole Wheat Flour, Sunflower Oil, Sea Salt, Yeast', cleanLabelScore: 85 },
          { id: '2', productName: 'Multigrain Biscuits', brandOwner: 'Britannia', category: 'Biscuits', similarityScore: 0.87, ingredients: 'Wheat Flour, Sugar, Palm Oil, Milk Powder, Salt', cleanLabelScore: 62 },
          { id: '3', productName: 'Whole Grain Bread', brandOwner: 'Dave\'s Killer Bread', category: 'Bakery', similarityScore: 0.83, ingredients: 'Whole Wheat Flour, Water, Cane Sugar, Wheat Gluten, Oat Fiber', cleanLabelScore: 78 },
          { id: '4', productName: 'Fiber One Bars', brandOwner: 'General Mills', category: 'Snacks', similarityScore: 0.79, ingredients: 'Chicory Root Extract, Whole Grain Oats, Sugar, Rice Flour', cleanLabelScore: 55 },
          { id: '5', productName: 'Wheat Thins', brandOwner: 'Nabisco', category: 'Snacks', similarityScore: 0.74, ingredients: 'Enriched Wheat Flour, Soybean Oil, Sugar, Cornstarch, Malt Syrup', cleanLabelScore: 45 },
        ].slice(0, topK),
      });
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-success';
    if (score >= 0.75) return 'text-primary';
    if (score >= 0.5) return 'text-accent';
    return 'text-muted-foreground';
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">Phase 3</Badge>
            <Badge variant="outline" className="border-accent/30 text-accent">Deep Learning</Badge>
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            <Sparkles className="mr-2 inline h-8 w-8 text-accent" />
            Similarity Search
          </h1>
          <p className="text-muted-foreground">
            Enter ingredients to find the top similar products using BERT embeddings &amp; cosine similarity
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Ingredients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Whole Wheat Flour, Sugar, Palm Oil, Cocoa Powder, Soy Lecithin..."
                  rows={5}
                  className="resize-none text-sm"
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Results: {topK}
                  </label>
                  <Slider
                    value={[topK]}
                    onValueChange={(v) => setTopK(v[0])}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
                <Button onClick={handleSearch} disabled={!text.trim() || loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? 'Searching…' : 'Find Similar'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-info/20 bg-info/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-5 w-5 shrink-0 text-info" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Powered by BERT</p>
                    <p className="text-xs text-muted-foreground">
                      Sentence-BERT generates 768-dim embeddings per product. Cosine similarity finds the closest matches in vector space.
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
                  Enter ingredients to discover similar products
                </p>
              </div>
            )}

            {error && !result && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {demoMode && (
                  <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-xs text-muted-foreground">
                      Demo mode — Connect backend with VITE_API_BASE_URL for real BERT-powered results.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">
                    Model: <span className="font-medium text-foreground">{result.modelUsed}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {result.searchTimeMs}ms
                  </span>
                </div>

                {result.results.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {i + 1}
                              </span>
                              <h3 className="truncate font-display text-base font-semibold text-foreground">
                                {product.productName}
                              </h3>
                            </div>
                            <p className="mb-2 text-sm text-muted-foreground">{product.brandOwner}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{product.ingredients}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary">{product.category}</Badge>
                              {product.cleanLabelScore !== null && (
                                <Badge variant="outline">Score: {product.cleanLabelScore}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className={`text-2xl font-bold ${getScoreColor(product.similarityScore)}`}>
                              {Math.round(product.similarityScore * 100)}%
                            </p>
                            <p className="text-xs text-muted-foreground">match</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
