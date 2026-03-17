import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';
import type { HealthRiskFactor } from '@/types/ingredient';

interface Props {
  breakdown: HealthRiskFactor[];
  title: string;
}

export default function ScoreBreakdown({ breakdown, title }: Props) {
  if (!breakdown || breakdown.length === 0) return null;

  const getIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'caution': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'caution': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="card-elevated p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <div className="space-y-2">
        {breakdown.map((factor, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-start gap-3 rounded-lg border p-3 ${getColor(factor.impact)}`}
          >
            <div className="mt-0.5">{getIcon(factor.impact)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{factor.ingredient}</p>
              <p className="text-xs opacity-80">{factor.reason}</p>
            </div>
            <span className="text-sm font-bold whitespace-nowrap">
              {factor.points > 0 ? '+' : ''}{factor.points}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
