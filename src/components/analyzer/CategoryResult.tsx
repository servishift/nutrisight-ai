import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import type { CategoryPrediction } from '@/types/ingredient';

interface Props {
  category: CategoryPrediction | null;
}

export default function CategoryResult({ category }: Props) {
  return (
    <div className="card-elevated p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        Category Prediction
      </h3>

      {category ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-lg font-semibold text-foreground">{category.category}</p>
          <p className="text-sm text-muted-foreground">
            Confidence: {Math.round(category.confidence * 100)}%
          </p>
        </motion.div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Backend Required</p>
            <p className="text-xs text-muted-foreground">
              Category prediction requires TF-IDF + ML model. Connect the FastAPI backend
              to enable this feature.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
