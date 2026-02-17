// Ingredient text processing utilities

export function parseIngredients(rawText: string): string[] {
  if (!rawText.trim()) return [];

  // Remove sub-ingredients in parentheses
  let cleaned = rawText.replace(/\([^)]*\)/g, '');
  // Remove brackets
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
  // Normalize separators
  cleaned = cleaned.replace(/;/g, ',');
  // Split by comma
  const ingredients = cleaned
    .split(',')
    .map((i) => i.trim().toLowerCase())
    .filter((i) => i.length > 1)
    .map((i) => i.replace(/[^a-z0-9\s\-']/g, '').trim())
    .filter(Boolean);

  return [...new Set(ingredients)];
}

export function calculateIngredientStats(ingredients: string[]): { name: string; count: number; percentage: number }[] {
  const total = ingredients.length;
  if (total === 0) return [];

  const frequencyMap = new Map<string, number>();
  ingredients.forEach((ing) => {
    frequencyMap.set(ing, (frequencyMap.get(ing) || 0) + 1);
  });

  return Array.from(frequencyMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// Known additive/artificial ingredient markers
const NEGATIVE_MARKERS = [
  'sodium benzoate', 'potassium sorbate', 'bht', 'bha', 'tbhq',
  'artificial', 'modified', 'hydrogenated', 'high fructose',
  'monosodium glutamate', 'msg', 'tartrazine', 'aspartame',
  'sucralose', 'acesulfame', 'red 40', 'yellow 5', 'yellow 6',
  'blue 1', 'caramel color', 'sodium nitrite', 'sodium nitrate',
];

const POSITIVE_MARKERS = [
  'organic', 'whole', 'vitamin', 'mineral', 'iron', 'calcium',
  'fiber', 'probiotic', 'natural', 'fresh', 'unprocessed',
];

export function calculateCleanLabelScore(ingredients: string[]): number {
  if (ingredients.length === 0) return 0;

  let score = 70; // Base score

  const joinedText = ingredients.join(' ');

  NEGATIVE_MARKERS.forEach((marker) => {
    if (joinedText.includes(marker)) {
      score -= 5;
    }
  });

  POSITIVE_MARKERS.forEach((marker) => {
    if (joinedText.includes(marker)) {
      score += 3;
    }
  });

  // Penalty for very long ingredient lists (processed food indicator)
  if (ingredients.length > 15) score -= 5;
  if (ingredients.length > 25) score -= 5;

  // Bonus for short lists
  if (ingredients.length <= 5) score += 10;

  return Math.max(0, Math.min(100, score));
}
