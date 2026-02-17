import { motion } from 'framer-motion';
import { ClipboardPaste, Cpu, FileBarChart } from 'lucide-react';

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
  return (
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
  );
}
