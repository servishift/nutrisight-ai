import { motion } from 'framer-motion';

interface Props {
  score: number | null;
  ingredientCount: number;
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 35) return 'Poor';
  return 'Very Poor';
}

function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-success/10 border-success/20';
  if (score >= 50) return 'bg-warning/10 border-warning/20';
  return 'bg-destructive/10 border-destructive/20';
}

export default function ScoreCard({ score, ingredientCount }: Props) {
  if (score === null) return null;

  return (
    <div className="card-elevated p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        Clean Label Score
      </h3>
      <div className="flex items-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`flex h-24 w-24 flex-col items-center justify-center rounded-2xl border ${getScoreBg(score)}`}
        >
          <span className={`font-display text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </motion.div>
        <div>
          <p className={`font-display text-lg font-semibold ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </p>
          <p className="text-sm text-muted-foreground">
            {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''} analyzed
          </p>
        </div>
      </div>
    </div>
  );
}
