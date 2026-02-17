import type { IngredientStat } from '@/types/ingredient';

interface Props {
  stats: IngredientStat[];
}

export default function IngredientStats({ stats }: Props) {
  if (stats.length === 0) return null;

  const maxCount = stats[0]?.count || 1;

  return (
    <div className="card-elevated p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        Ingredients Breakdown
      </h3>
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm capitalize text-foreground">{stat.name}</span>
              <span className="text-xs text-muted-foreground">{stat.percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(stat.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
