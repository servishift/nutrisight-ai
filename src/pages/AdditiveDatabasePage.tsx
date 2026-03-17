// Additive Knowledge Base browser (auth-gated)

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Beaker, Filter } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Additive {
  id: string;
  name: string;
  code: string;
  type: string;
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  frequency: number;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const TYPES = ['All', 'Preservative', 'Color', 'Flavor Enhancer', 'Sweetener', 'Emulsifier', 'Stabilizer', 'Antioxidant'];

function getRiskBadge(risk: string) {
  if (risk === 'high') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (risk === 'medium') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-success/10 text-success border-success/20';
}

export default function AdditiveDatabasePage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const { data: additives = [], isLoading } = useQuery({
    queryKey: ['additives'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/additives`);
      if (!response.ok) throw new Error('Failed to fetch additives');
      return response.json() as Promise<Additive[]>;
    }
  });

  const filtered = additives.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
                Additive Database
              </h1>
              <p className="text-muted-foreground">
                {isLoading ? 'Loading...' : `Browse ${additives.length} tracked food additives with risk assessments`}
              </p>
            </div>
            <DatabaseToggle />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search additives…"
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((additive, i) => (
            <motion.div
              key={additive.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-elevated p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Beaker className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{additive.name}</h3>
                </div>
                <Badge variant="outline" className={`text-[10px] ${getRiskBadge(additive.riskLevel)}`}>
                  {additive.riskLevel}
                </Badge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{additive.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {additive.type}
                </span>
                {additive.code && (
                  <span className="text-[10px] text-muted-foreground">
                    {additive.code}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && !isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No additives match your search
          </div>
        )}
      </div>
    </PageLayout>
  );
}
