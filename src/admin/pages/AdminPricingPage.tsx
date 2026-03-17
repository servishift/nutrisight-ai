import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getPlatformPlans, updatePlatformPlan, getApiPlansAdmin, updateApiPlan } from '../services/admin-api';

interface PlanField {
  price: number;
  limits?: Record<string, number>;
  requests?: number;
  rate_limit?: number;
  name: string;
}

export default function AdminPricingPage() {
  const { toast } = useToast();
  const [platformPlans, setPlatformPlans] = useState<Record<string, PlanField>>({});
  const [apiPlans, setApiPlans] = useState<Record<string, PlanField>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [p, a] = await Promise.all([getPlatformPlans(), getApiPlansAdmin()]);
      setPlatformPlans(p.plans as any);
      setApiPlans(a.plans as any);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const savePlatformPlan = async (planId: string) => {
    setSaving(`platform_${planId}`);
    try {
      const plan = platformPlans[planId];
      await updatePlatformPlan(planId, { price: plan.price, limits: plan.limits });
      toast({ title: 'Saved', description: `Platform plan "${plan.name}" updated` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const saveApiPlan = async (planId: string) => {
    setSaving(`api_${planId}`);
    try {
      const plan = apiPlans[planId];
      await updateApiPlan(planId, { price: plan.price, requests: plan.requests, rate_limit: plan.rate_limit });
      toast({ title: 'Saved', description: `API plan "${plan.name}" updated` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const updatePlatformField = (planId: string, field: string, value: number) => {
    setPlatformPlans((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  const updatePlatformLimit = (planId: string, limitKey: string, value: number) => {
    setPlatformPlans((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        limits: { ...(prev[planId].limits || {}), [limitKey]: value },
      },
    }));
  };

  const updateApiField = (planId: string, field: string, value: number) => {
    setApiPlans((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading pricing...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Pricing Management</h1>
        <p className="text-sm text-muted-foreground">
          Update plan prices and limits. Changes are saved to Firestore and reflected on the frontend within 60 seconds.
        </p>
      </div>

      {/* Platform Plans */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          Platform Subscription Plans
          <Badge variant="outline">payment_service.py</Badge>
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(platformPlans).map(([planId, plan]) => (
            <Card key={planId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {plan.name}
                  <Badge variant={planId === 'pro' ? 'default' : 'secondary'}>{planId}</Badge>
                </CardTitle>
                <CardDescription>Platform subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Price (paise) — ₹1 = 100 paise</Label>
                  <Input
                    type="number"
                    value={plan.price}
                    onChange={(e) => updatePlatformField(planId, 'price', parseInt(e.target.value) || 0)}
                    disabled={planId === 'enterprise'}
                  />
                  <p className="text-xs text-muted-foreground">
                    = ₹{((plan.price || 0) / 100).toFixed(0)}
                  </p>
                </div>

                {plan.limits && (
                  <>
                    <Separator />
                    <p className="text-xs font-medium text-foreground">Limits</p>
                    {Object.entries(plan.limits).map(([key, val]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{key.replace(/_/g, ' ')}</Label>
                        <Input
                          type="number"
                          value={val as number}
                          onChange={(e) => updatePlatformLimit(planId, key, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </>
                )}

                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => savePlatformPlan(planId)}
                  disabled={saving === `platform_${planId}` || planId === 'enterprise'}
                >
                  {saving === `platform_${planId}` ? 'Saving...' : planId === 'enterprise' ? 'Custom Pricing' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* API Plans */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          API Subscription Plans
          <Badge variant="outline">api_pricing_routes.py</Badge>
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(apiPlans).map(([planId, plan]) => (
            <Card key={planId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {plan.name}
                  <Badge variant={planId === 'professional' ? 'default' : 'secondary'}>{planId}</Badge>
                </CardTitle>
                <CardDescription>API subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Price (paise)</Label>
                  <Input
                    type="number"
                    value={plan.price}
                    onChange={(e) => updateApiField(planId, 'price', parseInt(e.target.value) || 0)}
                    disabled={planId === 'enterprise'}
                  />
                  <p className="text-xs text-muted-foreground">= ₹{((plan.price || 0) / 100).toFixed(0)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Requests (-1 = unlimited)</Label>
                  <Input
                    type="number"
                    value={plan.requests ?? -1}
                    onChange={(e) => updateApiField(planId, 'requests', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rate limit (req/min)</Label>
                  <Input
                    type="number"
                    value={plan.rate_limit ?? 10}
                    onChange={(e) => updateApiField(planId, 'rate_limit', parseInt(e.target.value) || 0)}
                  />
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => saveApiPlan(planId)}
                  disabled={saving === `api_${planId}` || planId === 'enterprise'}
                >
                  {saving === `api_${planId}` ? 'Saving...' : planId === 'enterprise' ? 'Custom Pricing' : 'Save'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 text-sm text-amber-700">
          <strong>Note:</strong> Price changes are stored in Firestore (<code>platform_plan_configs</code> / <code>api_plan_configs</code> collections).
          Frontend pricing pages poll every 60 seconds and will show a toast notification when prices change.
          Existing active subscriptions are not affected — only new purchases use the updated price.
        </CardContent>
      </Card>
    </div>
  );
}
