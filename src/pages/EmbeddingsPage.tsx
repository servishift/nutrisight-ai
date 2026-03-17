import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Atom, Zap } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getEmbeddingVisualization } from '@/services/phase3-api';
import type { EmbeddingVisualization } from '@/types/phase3';

const CLUSTER_COLORS = [
  'hsl(152 50% 45%)',
  'hsl(38 85% 55%)',
  'hsl(200 80% 50%)',
  'hsl(340 65% 55%)',
  'hsl(270 50% 55%)',
  'hsl(20 85% 55%)',
  'hsl(180 60% 45%)',
  'hsl(60 70% 50%)',
];

const CATEGORIES = ['All', 'Snacks', 'Beverages', 'Bakery', 'Dairy', 'Cereals', 'Condiments', 'Frozen'];

export default function EmbeddingsPage() {
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmbeddingVisualization[]>([]);

  useEffect(() => {
    // Delay initial load to let backend initialize
    const timer = setTimeout(() => {
      loadEmbeddings();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (category !== 'All') {
      loadEmbeddings();
    }
  }, [category]);

  const loadEmbeddings = async () => {
    setLoading(true);
    try {
      const embeddings = await getEmbeddingVisualization(category === 'All' ? undefined : category);
      setData(embeddings.map(e => ({
        ...e,
        productName: e.name || e.productName
      })));
    } catch (error: any) {
      console.error('Failed to load embeddings:', error);
      // Show empty state instead of error
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data;

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">Phase 3</Badge>
            <Badge variant="outline" className="border-accent/30 text-accent">Embeddings</Badge>
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            <Atom className="mr-2 inline h-8 w-8 text-primary" />
            Embedding Explorer
          </h1>
          <p className="text-muted-foreground">
            Visualize Sentence-BERT product embeddings reduced via t-SNE — explore clusters &amp; patterns
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Select value={category} onValueChange={setCategory} disabled={loading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : `${filtered.length} products`}
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">t-SNE Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] sm:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="x" type="number" name="Dim 1" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" type="number" name="Dim 2" tick={{ fontSize: 11 }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload as EmbeddingVisualization;
                      return (
                        <div className="rounded-lg border border-border bg-popover p-2 shadow-lg">
                          <p className="text-sm font-semibold text-foreground">{d.productName}</p>
                          <p className="text-xs text-muted-foreground">{d.category}</p>
                          <p className="text-xs text-muted-foreground">Cluster {d.cluster}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={filtered} fill="hsl(var(--primary))">
                    {filtered.map((entry, i) => (
                      <Cell key={entry.id} fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cluster legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Array.from(new Set(filtered.map((d) => d.cluster))).sort().map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }} />
              <span className="text-xs text-muted-foreground">Cluster {c}</span>
            </div>
          ))}
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">About Embeddings</p>
                <p className="text-xs text-muted-foreground">
                  Each product's ingredient list is encoded into a 768-dimensional vector using Sentence-BERT.
                  t-SNE reduces this to 2D for visualization. Products close together share similar ingredient profiles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
