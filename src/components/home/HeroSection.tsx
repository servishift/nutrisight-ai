import { motion } from 'framer-motion';
import { ArrowRight, Shield, Leaf, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            Phase 1 · Foundation Engine
          </div>

          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Know What's{' '}
            <span className="text-gradient-primary">Really</span>{' '}
            In Your Food
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            Paste any ingredient list. Get instant allergen detection,
            clean label scoring, and ingredient intelligence — powered by AI.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/analyzer">
                Analyze Ingredients
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/docs">View Documentation</Link>
            </Button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-20 grid max-w-4xl gap-6 md:grid-cols-3"
        >
          {[
            {
              icon: Shield,
              title: 'Allergen Detection',
              desc: '10 major allergen groups scanned with keyword matching',
            },
            {
              icon: Leaf,
              title: 'Clean Label Score',
              desc: 'Score 0–100 based on additives, preservatives & whole ingredients',
            },
            {
              icon: BarChart3,
              title: 'Ingredient Analytics',
              desc: 'Frequency breakdown and composition analysis',
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="card-elevated p-6 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
