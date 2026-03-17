import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Leaf, Shield, Zap, BarChart3, Search, FileText, CreditCard, Utensils, Sparkles, Brain, ArrowRightLeft, Atom, Key, Terminal, Activity, Webhook, Upload, Beaker, Network } from 'lucide-react';

const FEATURES = [
  {
    icon: <Search className="h-5 w-5" />,
    title: 'Ingredient Analyzer',
    desc: 'Instant allergen detection, clean label scoring, health risk assessment, and ingredient breakdown.',
    status: 'live',
    free: true,
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Allergen Detection',
    desc: 'Comprehensive scanning for 10+ major allergen groups including wheat, dairy, soy, eggs, tree nuts.',
    status: 'live',
    free: true,
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Clean Label Score',
    desc: 'AI-powered 0–100 score based on additives, preservatives, and whole ingredient analysis.',
    status: 'live',
    free: true,
  },
  {
    icon: <Utensils className="h-5 w-5" />,
    title: 'Nutrition Lookup',
    desc: 'Access detailed nutrition data from 1.5M+ foods. Get 26+ nutrients for any ingredient instantly.',
    status: 'live',
    free: true,
  },
  {
    icon: <Beaker className="h-5 w-5" />,
    title: 'Additive Database',
    desc: 'Browse comprehensive food additive information with health risk ratings and E-number lookup.',
    status: 'live',
    free: true,
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Category Prediction',
    desc: 'ML-powered food category classification using TF-IDF + Logistic Regression with explainable AI.',
    status: 'live',
    free: false,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Health Risk Scoring',
    desc: 'Configurable health risk engine with additive knowledge base and detailed risk factor breakdown.',
    status: 'live',
    free: true,
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Similarity Search',
    desc: 'BERT-based semantic similarity engine to find similar products by ingredient composition.',
    status: 'live',
    free: false,
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: 'Brand Prediction',
    desc: 'NLP-powered brand classification from ingredient lists using advanced machine learning.',
    status: 'live',
    free: false,
  },
  {
    icon: <ArrowRightLeft className="h-5 w-5" />,
    title: 'Reformulation Detection',
    desc: 'Detect and analyze ingredient changes between product versions with detailed comparison.',
    status: 'live',
    free: false,
  },
  {
    icon: <Atom className="h-5 w-5" />,
    title: 'Embedding Explorer',
    desc: 'Visualize and explore ingredient embeddings to understand semantic relationships.',
    status: 'live',
    free: false,
  },
  {
    icon: <Upload className="h-5 w-5" />,
    title: 'Batch Processing',
    desc: 'Upload CSV files to analyze multiple products at once with bulk export capabilities.',
    status: 'live',
    free: false,
  },
  {
    icon: <Key className="h-5 w-5" />,
    title: 'API Access',
    desc: 'RESTful API with key management, rate limiting, and comprehensive endpoint documentation.',
    status: 'live',
    free: false,
  },
  {
    icon: <Terminal className="h-5 w-5" />,
    title: 'API Playground',
    desc: 'Interactive API testing environment with live examples and response visualization.',
    status: 'live',
    free: false,
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Usage Analytics',
    desc: 'Track API usage, monitor rate limits, and view detailed analytics dashboards.',
    status: 'live',
    free: false,
  },
  {
    icon: <Webhook className="h-5 w-5" />,
    title: 'Webhooks',
    desc: 'Configure webhook endpoints for real-time event notifications and integrations.',
    status: 'live',
    free: false,
  },
  {
    icon: <Network className="h-5 w-5" />,
    title: 'Graph Intelligence',
    desc: 'Visualize ingredient relationships and co-occurrence patterns in food products.',
    status: 'live',
    free: false,
  },
];

const ROADMAP = [
  {
    phase: 'Core Features',
    status: 'Complete',
    active: true,
    items: ['Allergen detection engine', 'Clean label scoring', 'Health risk assessment', 'Nutrition lookup (1.5M+ foods)', 'Additive database', 'Ingredient analysis UI'],
  },
  {
    phase: 'ML Intelligence',
    status: 'Complete',
    active: true,
    items: ['Category prediction (TF-IDF + ML)', 'BERT embeddings', 'Similarity search engine', 'Brand prediction', 'Reformulation detection', 'Embedding explorer'],
  },
  {
    phase: 'API & Developer Tools',
    status: 'Complete',
    active: true,
    items: ['REST API endpoints', 'API key management', 'Interactive playground', 'Usage analytics', 'Webhook system', 'Batch CSV processing'],
  },
  {
    phase: 'Future Enhancements',
    status: 'Planned',
    active: false,
    items: ['PostgreSQL migration', 'Advanced caching', 'Real-time notifications', 'Mobile app', 'Multi-language support', 'Custom model training'],
  },
];

export default function Documentation() {
  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-10">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Features & Documentation
          </h1>
          <p className="text-muted-foreground">
            Complete feature overview of NutriSight AI platform
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            {/* Features */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground">All Features</h2>
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
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Getting Started</h2>
              <div className="card-elevated p-5 space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Core features are free</strong> — no login required. Start analyzing ingredients, checking allergens, and looking up nutrition data instantly.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Sign up for advanced features:</strong> ML-powered analysis, similarity search, brand prediction, API access, and batch processing.
                </p>
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Authentication includes:</h4>
                  <ul className="grid gap-1.5 text-xs text-muted-foreground">
                    <li>• Email/password with OTP verification</li>
                    <li>• OAuth login (Google)</li>
                    <li>• Password reset & 2FA support</li>
                    <li>• JWT-based secure sessions</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Roadmap sidebar */}
          <div>
            <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Development Status</h2>
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
                    <div className={`h-2.5 w-2.5 rounded-full ${phase.active ? 'bg-success animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <h3 className="text-sm font-semibold text-foreground">{phase.phase}</h3>
                  </div>
                  <p className="mb-2 pl-5 text-xs font-medium ${phase.active ? 'text-success' : 'text-muted-foreground'}">{phase.status}</p>
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
