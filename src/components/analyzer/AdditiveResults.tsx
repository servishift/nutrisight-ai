// Additive detection results display

import { motion } from 'framer-motion';
import { AlertTriangle, Info, Beaker } from 'lucide-react';
import type { Additive } from '@/types/ingredient';

interface Props {
  additives: Additive[];
}

function getRiskColor(risk: string) {
  if (risk === 'high') return 'border-destructive/20 bg-destructive/5 text-destructive';
  if (risk === 'medium') return 'border-warning/20 bg-warning/5 text-warning';
  return 'border-border bg-muted/50 text-muted-foreground';
}

function getRiskBadge(risk: string) {
  if (risk === 'high') return 'bg-destructive/10 text-destructive';
  if (risk === 'medium') return 'bg-warning/10 text-warning';
  return 'bg-muted text-muted-foreground';
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    preservative: '🧪 Preservative',
    color: '🎨 Color',
    flavor: '🌶️ Flavor',
    sweetener: '🍬 Sweetener',
    emulsifier: '🔗 Emulsifier',
    stabilizer: '⚖️ Stabilizer',
    antioxidant: '🛡️ Antioxidant',
  };
  return labels[type] || type;
}

export default function AdditiveResults({ additives }: Props) {
  if (additives.length === 0) {
    return (
      <div className="card-elevated p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
          Additive Analysis
        </h3>
        <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3">
          <Beaker className="h-4 w-4 text-success" />
          <p className="text-sm text-foreground">No known additives detected</p>
        </div>
      </div>
    );
  }

  const highRisk = additives.filter((a) => a.riskLevel === 'high');
  const medRisk = additives.filter((a) => a.riskLevel === 'medium');
  const lowRisk = additives.filter((a) => a.riskLevel === 'low');

  return (
    <div className="card-elevated p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Additive Analysis
        </h3>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {additives.length} found
        </span>
      </div>

      {/* Risk summary */}
      <div className="mb-4 flex gap-3">
        {highRisk.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {highRisk.length} high risk
          </div>
        )}
        {medRisk.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
            <Info className="h-3 w-3" />
            {medRisk.length} medium
          </div>
        )}
        {lowRisk.length > 0 && (
          <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {lowRisk.length} low
          </div>
        )}
      </div>

      {/* Additive list */}
      <div className="space-y-2">
        {additives.map((additive, i) => (
          <motion.div
            key={additive.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 ${getRiskColor(additive.riskLevel)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{additive.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getRiskBadge(additive.riskLevel)}`}>
                    {additive.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{additive.description}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {getTypeLabel(additive.type)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
