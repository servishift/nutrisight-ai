import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

export function UsageDisplay() {
  const { subscription, loading } = useSubscription();

  if (loading) return <div>Loading...</div>;

  if (!subscription) {
    return (
      <Card className="border-warning">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            No Active Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Subscribe to start using NutriSight AI</p>
          <Button asChild><Link to="/pricing">View Plans</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const analysesLimit = subscription.limits.analyses_per_month;
  const analysesUsed = subscription.usedAnalyses || 0;
  const analysesPercent = analysesLimit === -1 ? 0 : (analysesUsed / analysesLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />Your Plan
          </CardTitle>
          <Badge variant={subscription.planId === 'pro' ? 'default' : 'secondary'}>
            {subscription.planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Analyses</span>
            <span className="text-sm text-muted-foreground">
              {analysesUsed} / {analysesLimit === -1 ? '∞' : analysesLimit}
            </span>
          </div>
          {analysesLimit !== -1 && <Progress value={analysesPercent} className="h-2" />}
        </div>

        {subscription.planId === 'free' && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Get 5,000 analyses and all features for ₹149/month
                </p>
                <Button asChild size="sm"><Link to="/pricing">Upgrade Now</Link></Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
