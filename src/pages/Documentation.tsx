import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { API_ENDPOINTS } from '@/services/api';
import { Badge } from '@/components/ui/badge';

const ARCHITECTURE_MODULES = [
  { name: 'Ingredient Processor', desc: 'Text cleaning, normalization, parsing', status: 'active' },
  { name: 'Allergen Engine', desc: 'Keyword-based detection for 10 allergen groups', status: 'active' },
  { name: 'Clean Label Scorer', desc: 'Score 0–100 based on additive/whole ingredient ratio', status: 'active' },
  { name: 'Category Classifier', desc: 'TF-IDF + Logistic Regression model', status: 'planned' },
  { name: 'Additive Intelligence', desc: 'Structured additive database with risk levels', status: 'planned' },
  { name: 'Embedding Engine', desc: 'Sentence-BERT ingredient embeddings', status: 'planned' },
  { name: 'Similarity Engine', desc: 'Cosine similarity product recommendations', status: 'planned' },
  { name: 'Reformulation Detector', desc: 'Detect ingredient changes across versions', status: 'planned' },
];

const ROADMAP = [
  {
    phase: 'Phase 1 — Foundation',
    weeks: 'Weeks 1–3',
    active: true,
    items: ['Data cleaning & normalization', 'Allergen detection engine', 'Clean label scoring', 'Ingredient frequency analysis', 'Web UI MVP'],
  },
  {
    phase: 'Phase 2 — Intelligence',
    weeks: 'Weeks 4–8',
    active: false,
    items: ['Additive knowledge base', 'Health risk scoring', 'Explainable AI (SHAP)', 'Ingredient co-occurrence graph'],
  },
  {
    phase: 'Phase 3 — Deep Learning',
    weeks: 'Weeks 9–14',
    active: false,
    items: ['Sentence-BERT embeddings', 'Similarity engine', 'Brand prediction model', 'Reformulation detection'],
  },
  {
    phase: 'Phase 4 — SaaS',
    weeks: 'Weeks 15–20',
    active: false,
    items: ['FastAPI backend', 'PostgreSQL database', 'React dashboard', 'Docker deployment'],
  },
];

export default function Documentation() {
  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-10">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Documentation
          </h1>
          <p className="text-muted-foreground">
            Architecture, API reference, and development roadmap
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            {/* Architecture */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground">System Architecture</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                FoodIntel AI is designed as a modular engine. Each module runs independently
                and communicates through a unified API layer. The frontend uses client-side
                analysis in Phase 1, automatically switching to the FastAPI backend when
                configured via <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_API_BASE_URL</code>.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ARCHITECTURE_MODULES.map((mod) => (
                  <div key={mod.name} className="card-elevated p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{mod.name}</h4>
                      <Badge variant={mod.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {mod.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{mod.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* API Reference */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground">API Reference</h2>
              <div className="space-y-3">
                {API_ENDPOINTS.map((ep) => (
                  <div key={ep.path} className="card-elevated p-4">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {ep.method}
                      </span>
                      <code className="text-sm font-medium text-foreground">{ep.path}</code>
                      <Badge variant={ep.status === 'available' ? 'default' : 'secondary'} className="ml-auto text-[10px]">
                        {ep.status}
                      </Badge>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">{ep.description}</p>
                    {ep.requestBody && (
                      <div className="mb-1">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Request: </span>
                        <code className="text-xs text-foreground">{ep.requestBody}</code>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Response: </span>
                      <code className="text-xs text-foreground">{ep.responseBody}</code>
                    </div>
                  </div>
                ))}
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
                    <div className={`h-2.5 w-2.5 rounded-full ${phase.active ? 'bg-success animate-pulse-soft' : 'bg-muted-foreground/30'}`} />
                    <h3 className="text-sm font-semibold text-foreground">{phase.phase}</h3>
                  </div>
                  <p className="mb-2 pl-5 text-xs text-muted-foreground">{phase.weeks}</p>
                  <ul className="space-y-1 pl-5">
                    {phase.items.map((item) => (
                      <li key={item} className="text-xs text-muted-foreground">
                        • {item}
                      </li>
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
