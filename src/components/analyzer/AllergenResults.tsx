import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Allergen } from '@/types/ingredient';

interface Props {
  allergens: Allergen[];
}

export default function AllergenResults({ allergens }: Props) {
  const detected = allergens.filter((a) => a.detected);
  const safe = allergens.filter((a) => !a.detected);

  return (
    <div className="card-elevated p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        Allergen Scan
      </h3>

      {detected.length > 0 && (
        <div className="mb-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-destructive">
            Detected ({detected.length})
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {detected.map((a) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Matched: {a.matchedKeywords.join(', ')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {detected.length === 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3">
          <ShieldCheck className="h-4 w-4 text-success" />
          <p className="text-sm text-foreground">No major allergens detected</p>
        </div>
      )}

      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Not Detected ({safe.length})
        </span>
        <div className="flex flex-wrap gap-2">
          {safe.map((a) => (
            <span
              key={a.name}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
            >
              {a.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
