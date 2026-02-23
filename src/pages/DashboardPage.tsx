import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, Upload, BarChart3, Shield, Heart, Beaker,
  ArrowRight, Crown, Clock, TrendingUp, Sparkles, Brain,
  ArrowRightLeft, Atom, Key, Terminal, Activity, Webhook,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const QUICK_ACTIONS = [
  { icon: Search, title: 'Analyze Ingredients', desc: 'Allergen, additive & health analysis', href: '/analyzer', color: 'bg-primary/10 text-primary' },
  { icon: Sparkles, title: 'Similarity Search', desc: 'Find similar products via BERT', href: '/similarity', color: 'bg-accent/10 text-accent' },
  { icon: Brain, title: 'Brand Prediction', desc: 'Predict brand with NLP', href: '/brand-prediction', color: 'bg-info/10 text-info' },
  { icon: ArrowRightLeft, title: 'Reformulation', desc: 'Detect ingredient changes', href: '/reformulation', color: 'bg-warning/10 text-warning' },
  { icon: Upload, title: 'Batch Upload', desc: 'Analyze multiple via CSV', href: '/batch', color: 'bg-success/10 text-success' },
  { icon: Terminal, title: 'API Playground', desc: 'Test endpoints live', href: '/api-playground', color: 'bg-primary/10 text-primary' },
];

const ALL_FEATURES = [
  { icon: Shield, label: 'Allergen Detection', phase: 1, status: 'active' },
  { icon: Beaker, label: 'Additive Analysis', phase: 1, status: 'active' },
  { icon: Heart, label: 'Health Risk Score', phase: 1, status: 'active' },
  { icon: TrendingUp, label: 'Category Prediction', phase: 2, status: 'backend' },
  { icon: Sparkles, label: 'Similarity Search', phase: 3, status: 'active' },
  { icon: Brain, label: 'Brand Prediction', phase: 3, status: 'active' },
  { icon: ArrowRightLeft, label: 'Reformulation Detection', phase: 3, status: 'active' },
  { icon: Atom, label: 'Embedding Explorer', phase: 3, status: 'active' },
  { icon: Key, label: 'API Key Management', phase: 4, status: 'active' },
  { icon: Terminal, label: 'API Playground', phase: 4, status: 'active' },
  { icon: Activity, label: 'Usage Analytics', phase: 4, status: 'active' },
  { icon: Webhook, label: 'Webhooks', phase: 4, status: 'active' },
];

const DEVELOPER_LINKS = [
  { icon: Key, label: 'API Keys', href: '/api-keys' },
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
          <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
            Welcome back, {user?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground">Your ingredient intelligence dashboard — Phases 1–4 ready</p>
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
              {ALL_FEATURES.map((f) => (
                <div key={f.label} className="card-elevated flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px]">P{f.phase}</Badge>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      f.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {f.status === 'active' ? 'Active' : 'Backend'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
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

            {/* Subscription */}
            <div>
              <h2 className="mb-4 font-display text-xl font-bold text-foreground">Subscription</h2>
              <div className="card-elevated p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Crown className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Free Tier</p>
                    <p className="text-xs text-muted-foreground">Basic analysis access</p>
                  </div>
                </div>
                <ul className="mb-4 space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Clock className="h-3 w-3" /> Unlimited Phase 1 analysis</li>
                  <li className="flex items-center gap-2"><Shield className="h-3 w-3" /> Allergen + Additive detection</li>
                  <li className="flex items-center gap-2"><Heart className="h-3 w-3" /> Health risk scoring</li>
                </ul>
                <Button asChild className="w-full gap-2" variant="outline">
                  <Link to="/pricing"><Crown className="h-4 w-4" /> View Plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
