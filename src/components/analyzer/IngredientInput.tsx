import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import type { AnalysisStatus } from '@/types/ingredient';

interface Props {
  onAnalyze: (text: string) => void;
  status: AnalysisStatus;
}

export default function IngredientInput({ onAnalyze, status }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAnalyze(trimmed);
  };

  const isLoading = status === 'analyzing';

  return (
    <div className="card-elevated p-6">
      <label className="mb-2 block font-display text-lg font-semibold text-foreground">
        Ingredient List
      </label>
      <p className="mb-4 text-sm text-muted-foreground">
        Paste the ingredient list from any food product label
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Enriched Wheat Flour, Sugar, Palm Oil, Cocoa Powder, Soy Lecithin, Milk Powder, Salt, Artificial Flavor, Sodium Bicarbonate..."
        rows={5}
        className="mb-4 resize-none font-body text-sm"
      />
      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || isLoading}
        className="w-full gap-2 sm:w-auto"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {isLoading ? 'Analyzing…' : 'Analyze'}
      </Button>
    </div>
  );
}
