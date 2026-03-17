import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClipboardPaste, Cpu, FileBarChart, Key, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  {
    icon: ClipboardPaste,
    step: '01',
    title: 'Paste Ingredients',
    desc: 'Copy any ingredient list from a food product label',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'AI Analysis',
    desc: 'Engine scans for allergens, additives, and scores the label',
  },
  {
    icon: FileBarChart,
    step: '03',
    title: 'Get Report',
    desc: 'Instant breakdown with allergen alerts and clean label score',
  },
];

export default function HowItWorks() {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
    <section className="surface-sunken py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 font-display text-3xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-muted-foreground">Three steps to ingredient intelligence</p>
        </motion.div>

        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mb-1 block font-body text-xs font-semibold uppercase tracking-wider text-accent">
                Step {s.step}
              </span>
              <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* API Access CTA */}
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <div className="card-elevated overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 md:p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-3 font-display text-2xl md:text-3xl font-bold text-foreground">
                Integrate with API
              </h2>
              <p className="mb-6 text-muted-foreground">
                Access our powerful ingredient analysis engine programmatically. Get API keys, explore endpoints, and integrate NutriSight AI into your applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isAuthenticated ? (
                  <>
                    <Button asChild size="lg">
                      <Link to="/api-keys">
                        <Key className="mr-2 h-4 w-4" />
                        Get API Keys
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/api-playground">
                        Try Playground
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link to="/login">
                        Sign In for API Access
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/docs">
                        View Documentation
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
    </>
  );
}