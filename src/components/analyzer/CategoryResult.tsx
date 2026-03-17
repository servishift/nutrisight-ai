import { motion } from 'framer-motion';
import { Info, Sparkles, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { CategoryPrediction } from '@/types/ingredient';

interface Props {
  category: CategoryPrediction | null;
  ingredientText: string;
  onPredict: () => void;
  isLoading?: boolean;
}

export default function CategoryResult({ category, ingredientText, onPredict, isLoading }: Props) {
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="card-elevated p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
          Category Prediction
        </h3>
        <div className="flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Predicting category...</p>
        </div>
      </div>
    );
  }

  // Show login prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="card-elevated p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
          Category Prediction
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Premium Feature</p>
              <p className="text-xs text-muted-foreground">
                Sign in to unlock AI-powered category prediction
              </p>
            </div>
          </div>
          <Button asChild className="w-full gap-2">
            <Link to="/login">
              <Lock className="h-4 w-4" />
              Sign In to Predict
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        Category Prediction
      </h3>

      {category ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {category.confidence < 0.30 && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <p className="text-xs text-orange-700 dark:text-orange-400">
                <span className="font-semibold">Low confidence ({Math.round(category.confidence * 100)}%)</span> — input doesn't resemble a real food ingredient list. Results may be inaccurate.
              </p>
            </div>
          )}
          <div className={`rounded-lg border p-4 ${
            category.confidence < 0.30
              ? 'border-orange-500/20 bg-orange-500/5'
              : 'border-primary/20 bg-primary/5'
          }`}>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-lg font-semibold text-foreground">{category.category}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                category.confidence < 0.30
                  ? 'bg-orange-500/10 text-orange-600'
                  : 'bg-primary/10 text-primary'
              }`}>
                {Math.round(category.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Predicted food category</p>
          </div>
          <Button
            onClick={onPredict}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!ingredientText}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Predict Again
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Category Prediction</p>
              <p className="text-xs text-muted-foreground">
                Click below to predict food category using ML
              </p>
            </div>
          </div>
          <Button
            onClick={onPredict}
            className="w-full gap-2"
            disabled={!ingredientText}
          >
            <Sparkles className="h-4 w-4" />
            Predict Category
          </Button>
        </div>
      )}
    </div>
  );
}
