import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Leaf, Shield, Zap, BarChart3, Search, FileText, CreditCard } from 'lucide-react';

const FEATURES = [
  {
    icon: <Search className="h-5 w-5" />,
    title: 'Ingredient Analyzer',
    desc: 'Paste any ingredient list — get instant allergen detection, clean label scoring, and ingredient breakdown.',
    status: 'live',
    free: true,
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Allergen Detection',
    desc: 'Scans for 10 major allergen groups including wheat, dairy, soy, eggs, tree nuts, and more.',
    status: 'live',
    free: true,
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Clean Label Score',
    desc: 'AI-powered 0–100 score based on additive-to-whole-ingredient ratio and preservative counts.',
    status: 'live',
    free: true,
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Category Prediction',
    desc: 'ML-powered food category classification using TF-IDF + Logistic Regression. Requires backend.',
    status: 'coming',
    free: false,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Health Risk Scoring',
    desc: 'Configurable health risk engine with additive knowledge base and explainable AI.',
    status: 'coming',
    free: false,
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: 'API Access & Premium',
    desc: 'REST API access, batch CSV upload, similarity search, and advanced analytics via subscription.',
    status: 'coming',
    free: false,
  },
];

const ROADMAP = [
  {
    phase: 'Phase 1 — Foundation',
    weeks: 'Weeks 1–3',
    active: true,
    items: ['Allergen detection engine', 'Clean label scoring', 'Ingredient analysis UI', 'Authentication system'],
  },
  {
    phase: 'Phase 2 — Intelligence',
    weeks: 'Weeks 4–8',
    active: false,
    items: ['Additive knowledge base', 'Health risk scoring', 'Category prediction (ML)', 'Stripe subscriptions'],
  },
  {
    phase: 'Phase 3 — Deep Learning',
    weeks: 'Weeks 9–14',
    active: false,
    items: ['Sentence-BERT embeddings', 'Similarity engine', 'Brand prediction', 'Reformulation detection'],
  },
  {
    phase: 'Phase 4 — SaaS',
    weeks: 'Weeks 15–20',
    active: false,
    items: ['FastAPI backend', 'PostgreSQL database', 'Batch processing', 'Docker deployment'],
  },
];

export default function Documentation() {
  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-10">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Features & Guide
          </h1>
          <p className="text-muted-foreground">
            What FoodIntel AI offers and what's coming next
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            For technical API docs and backend integration guide, see{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">docs/</code> folder in the codebase.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            {/* Features */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Platform Features</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <div key={f.title} className="card-elevated p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {f.icon}
                      </div>
                      <div className="flex gap-1.5">
                        {f.free && (
                          <Badge variant="secondary" className="text-[10px]">Free</Badge>
                        )}
                        <Badge variant={f.status === 'live' ? 'default' : 'secondary'} className="text-[10px]">
                          {f.status === 'live' ? 'Live' : 'Coming soon'}
                        </Badge>
                      </div>
                    </div>
                    <h4 className="mb-1 text-sm font-semibold text-foreground">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* How auth works */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Authentication</h2>
              <div className="card-elevated p-5 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Phase 1 features (Analyzer, Allergen Detection, Clean Label Score) are <strong className="text-foreground">free for everyone</strong> — no login required.
                </p>
                <p className="text-sm text-muted-foreground">
                  Starting Phase 2, premium features require an account. The auth system supports:
                </p>
                <ul className="grid gap-1.5 text-xs text-muted-foreground">
                  <li>• Email/password registration with OTP verification</li>
                  <li>• OAuth login (Google)</li>
                  <li>• Password reset flow</li>
                  <li>• Two-factor authentication (2FA)</li>
                  <li>• JWT-based session with auto-refresh</li>
                  <li>• Stripe subscription integration for premium tiers</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Roadmap sidebar */}
          <div>
            <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Roadmap</h2>
            <div className="space-y-6">
              {ROADMAP.map((phase, i) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${phase.active ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <h3 className="text-sm font-semibold text-foreground">{phase.phase}</h3>
                  </div>
                  <p className="mb-2 pl-5 text-xs text-muted-foreground">{phase.weeks}</p>
                  <ul className="space-y-1 pl-5">
                    {phase.items.map((item) => (
                      <li key={item} className="text-xs text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
