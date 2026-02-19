// Pricing page — Stripe-ready subscription UI

import { motion } from 'framer-motion';
import { Check, Crown, Zap, Building2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PricingPlan {
  name: string;
  icon: React.ElementType;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  disabled?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: 'Free',
    icon: Zap,
    price: '$0',
    period: 'forever',
    description: 'Phase 1 features — no login required',
    features: [
      'Unlimited ingredient analysis',
      'Allergen detection (10 groups)',
      'Clean label scoring',
      'Additive detection',
      'Health risk scoring',
      'Ingredient breakdown',
    ],
    cta: 'Get Started',
    disabled: false,
  },
  {
    name: 'Pro',
    icon: Crown,
    price: '$19',
    period: '/month',
    description: 'Full intelligence suite for professionals',
    features: [
      'Everything in Free',
      'ML category prediction',
      'Batch CSV analysis (1000 rows)',
      'API access (1000 req/mo)',
      'Similarity search',
      'Export reports (PDF/CSV)',
      'Priority support',
    ],
    cta: 'Coming Soon',
    popular: true,
    disabled: true,
  },
  {
    name: 'Enterprise',
    icon: Building2,
    price: 'Custom',
    period: '',
    description: 'For food brands and R&D teams',
    features: [
      'Everything in Pro',
      'Unlimited API access',
      'Brand prediction model',
      'Reformulation detection',
      'BERT embeddings',
      'Custom scoring weights',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    disabled: true,
  },
];

export default function PricingPage() {
  const handleSubscribe = (plan: string) => {
    // Backend: POST /api/subscription/create → redirect to Stripe Checkout
    console.log(`Subscribe to ${plan}`);
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-3 font-display text-4xl font-bold text-foreground">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Start free with full Phase 1 access. Upgrade for ML-powered features, batch processing, and API access.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className={`relative card-elevated flex flex-col p-6 ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  plan.popular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <plan.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              </div>

              <div className="mb-2">
                <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mb-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={plan.disabled}
                onClick={() => handleSubscribe(plan.name)}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Stripe notice */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Payments processed securely via Stripe. Plans activate after backend integration.
        </p>
      </div>
    </PageLayout>
  );
}
