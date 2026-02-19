// Health risk score display with factor breakdown

import { motion } from 'framer-motion';
import { Heart, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { HealthRiskBreakdown } from '@/types/ingredient';

interface Props {
  healthRisk: HealthRiskBreakdown;
}

function getRiskColor(level: string) {
  if (level === 'low') return 'text-success';
  if (level === 'moderate') return 'text-warning';
  return 'text-destructive';
}

function getRiskBg(level: string) {
  if (level === 'low') return 'bg-success/10 border-success/20';
  if (level === 'moderate') return 'bg-warning/10 border-warning/20';
  return 'bg-destructive/10 border-destructive/20';
}

function getRiskLabel(level: string) {
  const labels: Record<string, string> = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    'very-high': 'Very High Risk',
  };
  return labels[level] || level;
}

function getImpactIcon(impact: string) {
  if (impact === 'positive') return <TrendingUp className="h-3.5 w-3.5 text-success" />;
  if (impact === 'negative') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  if (impact === 'caution') return <Minus className="h-3.5 w-3.5 text-warning" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function HealthRiskCard({ healthRisk }: Props) {
  return (
    <div className="card-elevated p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        Health Risk Score
      </h3>

      <div className="mb-5 flex items-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`flex h-24 w-24 flex-col items-center justify-center rounded-2xl border ${getRiskBg(healthRisk.riskLevel)}`}
        >
          <Heart className={`mb-1 h-5 w-5 ${getRiskColor(healthRisk.riskLevel)}`} />
          <span className={`font-display text-2xl font-bold ${getRiskColor(healthRisk.riskLevel)}`}>
            {healthRisk.score}
          </span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </motion.div>
        <div>
          <p className={`font-display text-lg font-semibold ${getRiskColor(healthRisk.riskLevel)}`}>
            {getRiskLabel(healthRisk.riskLevel)}
          </p>
          <p className="text-sm text-muted-foreground">
            {healthRisk.additiveCount} additive{healthRisk.additiveCount !== 1 ? 's' : ''} analyzed
          </p>
        </div>
      </div>

      {/* Factor breakdown */}
      {healthRisk.factors.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contributing Factors
          </h4>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {healthRisk.factors.slice(0, 10).map((factor, i) => (
              <motion.div
                key={`${factor.ingredient}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
              >
                {getImpactIcon(factor.impact)}
                <span className="flex-1 text-xs text-foreground">{factor.ingredient}</span>
                <span className={`text-xs font-medium ${factor.points > 0 ? 'text-success' : factor.points < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {factor.points > 0 ? '+' : ''}{factor.points}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
