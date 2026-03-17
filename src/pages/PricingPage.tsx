import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/subscription/CheckoutButton';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface BackendPlan {
  name: string;
  price: number;
  currency: string;
  interval: string;
  limits: { analyses_per_month: number; batch_rows_per_month: number; api_requests_per_month: number };
  features: Record<string, boolean>;
}

const PLAN_ICONS: Record<string, React.ElementType> = { free: Zap, pro: Crown, enterprise: Building2 };
const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: 'Perfect for trying out our platform',
  pro: 'For professionals and small teams',
  enterprise: 'For food brands and R&D teams',
};
const PLAN_FEATURES_DISPLAY: Record<string, string[]> = {
  free: ['Ingredient analysis (50/month)', 'Allergen detection (10+ groups)', 'Clean label scoring (0-100)', 'Health risk assessment', 'Nutrition lookup (1.5M+ foods)', 'Additive database access'],
  pro: ['Everything in Free', 'ML category prediction', 'Batch CSV analysis', 'API access', 'Similarity search engine', 'Brand prediction', 'Export reports (PDF/CSV)', 'Webhooks', 'Email support'],
  enterprise: ['Everything in Pro', 'Unlimited API requests', 'Reformulation detection', 'BERT embeddings & vectors', 'Custom model training', 'White-label options', 'Dedicated account manager', 'SLA guarantee (99.9% uptime)', 'Priority phone support'],
};
const PLAN_ORDER = ['free', 'pro', 'enterprise'];

const ALL_FEATURES = [
  { name: 'Allergen Detection', phase: 'Core', path: '/analyzer' },
  { name: 'Additive Analysis', phase: 'Core', path: '/additives' },
  { name: 'Health Risk Score', phase: 'Core', path: '/analyzer' },
  { name: 'Nutrition Lookup', phase: 'Core', path: '/nutrition-lookup' },
  { name: 'Category Prediction', phase: 'ML', path: '/analyzer' },
  { name: 'Similarity Search', phase: 'ML', path: '/similarity' },
  { name: 'Brand Prediction', phase: 'ML', path: '/brand-prediction' },
  { name: 'Reformulation Detection', phase: 'ML', path: '/reformulation' },
  { name: 'Embedding Explorer', phase: 'ML', path: '/embeddings' },
  { name: 'API Key Management', phase: 'API', path: '/api-keys' },
  { name: 'API Playground', phase: 'API', path: '/api-playground' },
  { name: 'Usage Analytics', phase: 'API', path: '/api-usage' },
  { name: 'Webhooks', phase: 'API', path: '/webhooks' },
];

export default function PricingPage() {
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const currentPlan = subscription?.planId || null;
  const [plans, setPlans] = useState<Record<string, BackendPlan>>({});
  const [loading, setLoading] = useState(true);
  const prevPricesRef = useRef<Record<string, number>>({});

  const fetchPlans = async (isPolling = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/payment/plans`);
      if (!res.ok) return;
      const data = await res.json();
      const fetched: Record<string, BackendPlan> = data.plans || {};
      if (isPolling) {
        for (const [id, plan] of Object.entries(fetched)) {
          const prev = prevPricesRef.current[id];
          if (prev !== undefined && prev !== plan.price) {
            toast({
              title: 'Price Updated',
              description: `${plan.name} plan price changed to ${plan.price === 0 ? 'Free' : `\u20b9${(plan.price / 100).toFixed(0)}`}`,
            });
          }
        }
      }
      prevPricesRef.current = Object.fromEntries(Object.entries(fetched).map(([id, p]) => [id, p.price]));
      setPlans(fetched);
    } catch {
      // keep existing plans on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    const interval = setInterval(() => fetchPlans(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const orderedPlans = PLAN_ORDER.filter((id) => plans[id]).map((id) => ({ id, ...plans[id] }));

  const getPriceDisplay = (plan: BackendPlan & { id: string }) => {
    if (plan.price === 0 && plan.id === 'free') return { label: '\u20b90', period: 'forever' };
    if (plan.price === 0) return { label: 'Custom', period: '' };
    return { label: `\u20b9${(plan.price / 100).toFixed(0)}`, period: '/month' };
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading plans...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-10 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-3 font-display text-4xl font-bold text-foreground">
            Choose Your Plan
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Start free and scale as you grow. Access powerful ingredient intelligence, nutrition data from 1.5M+ foods, and ML-powered analysis.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {orderedPlans.map((plan, i) => {
            const { label: priceLabel, period } = getPriceDisplay(plan);
            const Icon = PLAN_ICONS[plan.id] || Zap;
            const isPopular = plan.id === 'pro';
            const features = PLAN_FEATURES_DISPLAY[plan.id] || [];
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className={`relative card-elevated flex flex-col p-6 ${isPopular ? 'ring-2 ring-primary' : ''}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isPopular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                </div>
                <div className="mb-2">
                  <span className="font-display text-4xl font-bold text-foreground">{priceLabel}</span>
                  {period && <span className="text-sm text-muted-foreground">{period}</span>}
                </div>
                <p className="mb-6 text-sm text-muted-foreground">{PLAN_DESCRIPTIONS[plan.id] || ''}</p>
                <ul className="mb-6 flex-1 space-y-2.5">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  planId={plan.id}
                  planName={plan.name}
                  price={plan.price}
                  disabled={currentPlan === plan.id}
                />
                {currentPlan === plan.id && (
                  <p className="mt-2 text-center text-xs text-success">Current Plan</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* All Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-20 max-w-5xl"
        >
          <div className="text-center mb-8">
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="text-muted-foreground">All features are production-ready and actively maintained</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_FEATURES.map((feature) => (
              <Link
                key={feature.name}
                to={feature.path}
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:bg-accent hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary">{feature.name}</p>
                  <p className="text-xs text-muted-foreground">{feature.phase}</p>
                </div>
                <Badge variant="default" className="bg-success">Active</Badge>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* API Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="card-elevated overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="mb-3 font-display text-2xl md:text-3xl font-bold text-foreground">
                    Powerful API for Developers
                  </h2>
                  <p className="mb-4 text-muted-foreground">
                    Integrate ingredient intelligence into your applications with our RESTful API.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />RESTful endpoints with JSON responses</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />API key authentication</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Rate limiting & usage analytics</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Interactive playground & docs</li>
                  </ul>
                  <div className="flex gap-3">
                    <Button asChild><Link to="/docs">View API Docs</Link></Button>
                    <Button asChild variant="outline"><Link to="/api-playground">Try Playground</Link></Button>
                  </div>
                </div>
                <div className="card-elevated p-6 bg-background">
                  <div className="text-xs font-mono text-muted-foreground mb-2">POST /api/analyze</div>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{`{\n  "ingredientText": "wheat flour,\n    sugar, eggs, butter"\n}`}</code>
                  </pre>
                  <div className="mt-4 flex items-center gap-2 text-xs text-success">
                    <Check className="h-3 w-3" /><span>Response in ~50ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mx-auto mt-16 max-w-4xl text-center"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div><div className="text-3xl font-bold text-primary mb-2">1.5M+</div><div className="text-sm text-muted-foreground">Foods in Database</div></div>
            <div><div className="text-3xl font-bold text-primary mb-2">26+</div><div className="text-sm text-muted-foreground">Nutrients Tracked</div></div>
            <div><div className="text-3xl font-bold text-primary mb-2">~50ms</div><div className="text-sm text-muted-foreground">API Response Time</div></div>
          </div>
        </motion.div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Payments processed securely via Razorpay. All plans are active and ready to use.
        </p>
      </div>
    </PageLayout>
  );
}
