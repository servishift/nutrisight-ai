import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, TrendingDown, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Contribution {
  feature: string;
  shapValue: number;
  impact: 'positive' | 'negative';
  importance: number;
}

interface Props {
  contributions: Contribution[] | null;
  predictedCategory: string | null;
  onExplain: () => void;
  isLoading?: boolean;
}

export default function ExplainabilityCard({ contributions, predictedCategory, onExplain, isLoading }: Props) {
  const { isAuthenticated } = useAuth();

  // Show login prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="card-elevated p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Prediction Insights
          </h3>
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Premium Feature</p>
              <p className="text-xs text-muted-foreground">
                Sign in to unlock prediction insights and detailed analysis
              </p>
            </div>
          </div>
          <Button asChild className="w-full gap-2">
            <Link to="/login">
              <Lock className="h-4 w-4" />
              Sign In to Unlock
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Prediction Insights
        </h3>
        <Lightbulb className="h-5 w-5 text-primary" />
      </div>

      {contributions && contributions.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Predicted as</p>
            <p className="font-semibold text-foreground">{predictedCategory}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Key Ingredients Influencing Classification:</p>
            {contributions.slice(0, 8).map((contrib, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {contrib.impact === 'positive' ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{contrib.feature}</p>
                  <p className="text-xs text-muted-foreground">
                    {contrib.impact === 'positive' ? 'Strong indicator' : 'Weak indicator'} • Impact: {contrib.shapValue.toFixed(3)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${contrib.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(contrib.importance * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {(contrib.importance * 100).toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-lg border border-muted bg-muted/30 p-3">
            <p className="text-xs font-medium text-foreground mb-1">Analysis Method</p>
            <p className="text-xs text-muted-foreground">
              Using SHAP (SHapley Additive exPlanations) values from machine learning model trained on FoodData Central database.
            </p>
            <a 
              href="https://github.com/shap/shap" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Learn about SHAP <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Button
            onClick={onExplain}
            variant="outline"
            size="sm"
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Lightbulb className="h-4 w-4" />
            Refresh Analysis
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get detailed insights on how specific ingredients influence the category prediction using machine learning analysis.
          </p>
          <Button
            onClick={onExplain}
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Lightbulb className="h-4 w-4" />
            {isLoading ? 'Analyzing...' : 'Analyze Prediction'}
          </Button>
        </div>
      )}
    </div>
  );
}
