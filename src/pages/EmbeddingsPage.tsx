import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Atom, Info, Zap } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

// Demo data (t-SNE reduced)
const DEMO_DATA: EmbeddingVisualization[] = Array.from({ length: 80 }, (_, i) => {
  const cluster = i % 6;
  const cx = [20, 60, 80, 35, 70, 15][cluster];
  const cy = [30, 70, 25, 65, 50, 75][cluster];
  return {
    id: `prod-${i}`,
    productName: `Product ${i + 1}`,
    x: cx + (Math.random() - 0.5) * 18,
    y: cy + (Math.random() - 0.5) * 18,
    category: CATEGORIES[1 + (cluster % (CATEGORIES.length - 1))],
    cluster,
  };
});

export default function EmbeddingsPage() {
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmbeddingVisualization[]>(DEMO_DATA);
  const [demoMode] = useState(true);

  const filtered = category === 'All' ? data : data.filter((d) => d.category === category);

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

        {demoMode && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs text-muted-foreground">
              Demo mode — showing synthetic t-SNE visualization. Connect backend for real product embeddings.
            </p>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} products</span>
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
