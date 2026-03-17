import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function SubscriptionGate({ children, feature }: SubscriptionGateProps) {
  const { subscription, loading, hasFeature } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !subscription) {
      // No subscription - redirect to pricing
      navigate('/pricing');
    }
  }, [loading, subscription, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Subscription Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need an active subscription to access this feature.
            </p>
            <Button onClick={() => navigate('/pricing')} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (feature && !hasFeature(feature)) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Upgrade Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This feature is not available in your current plan.
            </p>
            <p className="text-sm text-muted-foreground">
              Current plan: <strong>{subscription.planName}</strong>
            </p>
            <Button onClick={() => navigate('/pricing')} className="w-full">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
