import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, Upload, BarChart3, Shield, Heart, Beaker,
  ArrowRight, Crown, Clock, TrendingUp, Sparkles, Brain,
  ArrowRightLeft, Atom, Key, Terminal, Activity, Webhook, Utensils, DollarSign,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { UsageDisplay } from '@/components/subscription/UsageDisplay';

const QUICK_ACTIONS = [
  { icon: Search, title: 'Analyze Ingredients', desc: 'Allergen, additive & health analysis', href: '/analyzer', color: 'bg-primary/10 text-primary' },
  { icon: Utensils, title: 'Nutrition Lookup', desc: 'Get nutrition from ingredients', href: '/nutrition-lookup', color: 'bg-success/10 text-success' },
  { icon: Sparkles, title: 'Similarity Search', desc: 'Find similar products via BERT', href: '/similarity', color: 'bg-accent/10 text-accent' },
  { icon: Brain, title: 'Brand Prediction', desc: 'Predict brand with NLP', href: '/brand-prediction', color: 'bg-info/10 text-info' },
  { icon: ArrowRightLeft, title: 'Reformulation', desc: 'Detect ingredient changes', href: '/reformulation', color: 'bg-warning/10 text-warning' },
  { icon: Upload, title: 'Batch Upload', desc: 'Analyze multiple via CSV', href: '/batch', color: 'bg-success/10 text-success' },
];

const FEATURE_LINKS = [
  { icon: Shield, label: 'Allergen Detection', category: 'Core', status: 'active', href: '/analyzer' },
  { icon: Beaker, label: 'Additive Analysis', category: 'Core', status: 'active', href: '/additives' },
  { icon: Heart, label: 'Health Risk Score', category: 'Core', status: 'active', href: '/analyzer' },
  { icon: Utensils, label: 'Nutrition Lookup', category: 'Core', status: 'active', href: '/nutrition-lookup' },
  { icon: TrendingUp, label: 'Category Prediction', category: 'ML', status: 'active', href: '/analyzer' },
  { icon: Sparkles, label: 'Similarity Search', category: 'ML', status: 'active', href: '/similarity' },
  { icon: Brain, label: 'Brand Prediction', category: 'ML', status: 'active', href: '/brand-prediction' },
  { icon: ArrowRightLeft, label: 'Reformulation Detection', category: 'ML', status: 'active', href: '/reformulation' },
  { icon: Atom, label: 'Embedding Explorer', category: 'ML', status: 'active', href: '/embeddings' },
  { icon: Key, label: 'API Key Management', category: 'API', status: 'active', href: '/api-keys' },
  { icon: Terminal, label: 'API Playground', category: 'API', status: 'active', href: '/api-playground' },
  { icon: Activity, label: 'Usage Analytics', category: 'API', status: 'active', href: '/api-usage' },
  { icon: Webhook, label: 'Webhooks', category: 'API', status: 'active', href: '/webhooks' },
];

const DEVELOPER_LINKS = [
  { icon: Key, label: 'API Keys', href: '/api-keys' },
  { icon: DollarSign, label: 'API Pricing', href: '/api-pricing' },
  { icon: Terminal, label: 'Playground', href: '/api-playground' },
  { icon: Activity, label: 'Usage', href: '/api-usage' },
  { icon: Webhook, label: 'Webhooks', href: '/webhooks' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
                Welcome back, {user?.displayName?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-muted-foreground">Your ingredient intelligence dashboard — All features ready</p>
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div key={action.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={action.href} className="card-elevated group flex items-start gap-4 p-5 transition-all hover:shadow-lg">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-0.5 text-sm font-semibold text-foreground">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Feature status */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 font-display text-xl font-bold text-foreground">All Features</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {FEATURE_LINKS.map((f) => (
                <Link
                  key={f.label}
                  to={f.href}
                  className="card-elevated group flex items-center gap-3 p-4 transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary">{f.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px]">{f.category}</Badge>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase bg-success/10 text-success">
                      Active
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Usage Display */}
            <div>
              <h2 className="mb-4 font-display text-xl font-bold text-foreground">Your Plan</h2>
              <UsageDisplay />
            </div>

            {/* Developer tools */}
            <div>
              <h2 className="mb-4 font-display text-xl font-bold text-foreground">Developer</h2>
              <div className="space-y-2">
                {DEVELOPER_LINKS.map((d) => (
                  <Link key={d.label} to={d.href} className="card-elevated group flex items-center gap-3 p-3 transition-all hover:shadow-md">
                    <d.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{d.label}</span>
                    <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Subscription - Removed duplicate, now using UsageDisplay above */}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
