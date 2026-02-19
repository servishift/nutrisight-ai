// Additive Knowledge Base browser (auth-gated)

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Beaker, Filter } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdditiveKBEntry {
  name: string;
  type: string;
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  eCodes: string[];
}

const ADDITIVE_KB: AdditiveKBEntry[] = [
  { name: 'Sodium Benzoate', type: 'Preservative', riskLevel: 'medium', description: 'Common preservative linked to hyperactivity when combined with artificial colors.', eCodes: ['E211'] },
  { name: 'Potassium Sorbate', type: 'Preservative', riskLevel: 'low', description: 'Widely used preservative, generally recognized as safe.', eCodes: ['E202'] },
  { name: 'Sodium Nitrite', type: 'Preservative', riskLevel: 'high', description: 'Used in processed meats, linked to carcinogenic nitrosamines.', eCodes: ['E250'] },
  { name: 'BHA', type: 'Antioxidant', riskLevel: 'high', description: 'Butylated hydroxyanisole — potential endocrine disruptor.', eCodes: ['E320'] },
  { name: 'BHT', type: 'Antioxidant', riskLevel: 'medium', description: 'Butylated hydroxytoluene — synthetic antioxidant.', eCodes: ['E321'] },
  { name: 'Tartrazine', type: 'Color', riskLevel: 'high', description: 'Yellow azo dye linked to hyperactivity in children.', eCodes: ['E102'] },
  { name: 'Allura Red', type: 'Color', riskLevel: 'high', description: 'Most widely used food dye, linked to behavioral issues.', eCodes: ['E129'] },
  { name: 'Sunset Yellow', type: 'Color', riskLevel: 'high', description: 'Synthetic azo dye, banned in some countries.', eCodes: ['E110'] },
  { name: 'Brilliant Blue', type: 'Color', riskLevel: 'medium', description: 'Petroleum-derived synthetic dye.', eCodes: ['E133'] },
  { name: 'Caramel Color', type: 'Color', riskLevel: 'medium', description: 'Some types contain 4-MEI, a potential carcinogen.', eCodes: ['E150'] },
  { name: 'MSG', type: 'Flavor Enhancer', riskLevel: 'medium', description: 'Monosodium glutamate — can cause sensitivity reactions.', eCodes: ['E621'] },
  { name: 'Aspartame', type: 'Sweetener', riskLevel: 'medium', description: 'IARC classified as possibly carcinogenic to humans.', eCodes: ['E951'] },
  { name: 'Sucralose', type: 'Sweetener', riskLevel: 'low', description: 'Non-caloric sweetener, 600x sweeter than sugar.', eCodes: ['E955'] },
  { name: 'Acesulfame K', type: 'Sweetener', riskLevel: 'medium', description: 'Limited long-term studies available.', eCodes: ['E950'] },
  { name: 'HFCS', type: 'Sweetener', riskLevel: 'high', description: 'Linked to obesity, diabetes, and metabolic syndrome.', eCodes: [] },
  { name: 'Carrageenan', type: 'Emulsifier', riskLevel: 'medium', description: 'Seaweed-derived, linked to gut inflammation.', eCodes: ['E407'] },
  { name: 'Polysorbate 80', type: 'Emulsifier', riskLevel: 'medium', description: 'Synthetic emulsifier, may affect gut microbiome.', eCodes: ['E433'] },
  { name: 'Soy Lecithin', type: 'Emulsifier', riskLevel: 'low', description: 'Common emulsifier from soybeans, generally safe.', eCodes: ['E322'] },
  { name: 'Xanthan Gum', type: 'Stabilizer', riskLevel: 'low', description: 'Fermented sugar product, generally safe.', eCodes: ['E415'] },
  { name: 'Guar Gum', type: 'Stabilizer', riskLevel: 'low', description: 'Natural thickener from guar beans.', eCodes: ['E412'] },
  { name: 'TBHQ', type: 'Antioxidant', riskLevel: 'medium', description: 'Petrochemical-derived preservative.', eCodes: ['E319'] },
  { name: 'Sulfites', type: 'Preservative', riskLevel: 'medium', description: 'Can trigger asthma and allergic reactions.', eCodes: ['E220-E228'] },
];

const TYPES = ['All', 'Preservative', 'Color', 'Flavor Enhancer', 'Sweetener', 'Emulsifier', 'Stabilizer', 'Antioxidant'];

function getRiskBadge(risk: string) {
  if (risk === 'high') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (risk === 'medium') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-success/10 text-success border-success/20';
}

export default function AdditiveDatabasePage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = ADDITIVE_KB.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Additive Database
          </h1>
          <p className="text-muted-foreground">
            Browse {ADDITIVE_KB.length} tracked food additives with risk assessments
          </p>
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
              key={additive.name}
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
                {additive.eCodes.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {additive.eCodes.join(', ')}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No additives match your search
          </div>
        )}
      </div>
    </PageLayout>
  );
}
