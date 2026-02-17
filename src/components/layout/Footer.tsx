import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold text-foreground">
              FoodIntel AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ingredient Intelligence & Health Risk Engine · Phase 1
          </p>
        </div>
      </div>
    </footer>
  );
}
