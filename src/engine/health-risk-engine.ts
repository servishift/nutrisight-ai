// Health risk scoring engine — configurable weighted scoring

import type { Additive, HealthRiskBreakdown } from '@/types/ingredient';

interface ScoringWeights {
  preservative: number;
  color: number;
  flavor: number;
  sweetener: number;
  emulsifier: number;
  stabilizer: number;
  antioxidant: number;
  highRiskMultiplier: number;
  mediumRiskMultiplier: number;
  longListPenalty: number;
  wholeIngredientBonus: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  preservative: 5,
  color: 4,
  flavor: 3,
  sweetener: 4,
  emulsifier: 2,
  stabilizer: 1,
  antioxidant: 3,
  highRiskMultiplier: 2.0,
  mediumRiskMultiplier: 1.0,
  longListPenalty: 3,
  wholeIngredientBonus: 2,
};

const WHOLE_MARKERS = [
  'organic', 'whole', 'vitamin', 'mineral', 'iron', 'calcium',
  'fiber', 'probiotic', 'natural', 'fresh', 'unprocessed',
  'olive oil', 'coconut oil', 'honey', 'oat', 'brown rice',
];

export function calculateHealthRisk(
  ingredients: string[],
  additives: Additive[],
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): HealthRiskBreakdown {
  let penalty = 0;
  const factors: HealthRiskBreakdown['factors'] = [];

  // Additive penalties
  additives.forEach((additive) => {
    const basePenalty = weights[additive.type] || 2;
    const riskMultiplier =
      additive.riskLevel === 'high'
        ? weights.highRiskMultiplier
        : additive.riskLevel === 'medium'
          ? weights.mediumRiskMultiplier
          : 0.5;

    const points = Math.round(basePenalty * riskMultiplier);
    penalty += points;

    factors.push({
      ingredient: additive.name,
      impact: additive.riskLevel === 'high' ? 'negative' : additive.riskLevel === 'medium' ? 'caution' : 'neutral',
      points: -points,
      reason: `${additive.type} (${additive.riskLevel} risk)`,
    });
  });

  // Long ingredient list penalty
  if (ingredients.length > 15) {
    const extra = Math.min(Math.floor((ingredients.length - 15) / 5), 3);
    const points = extra * weights.longListPenalty;
    penalty += points;
    factors.push({
      ingredient: `${ingredients.length} ingredients`,
      impact: 'caution',
      points: -points,
      reason: 'Long ingredient list indicates processing',
    });
  }

  // Whole ingredient bonuses
  let bonus = 0;
  const joinedText = ingredients.join(' ');
  WHOLE_MARKERS.forEach((marker) => {
    if (joinedText.includes(marker)) {
      bonus += weights.wholeIngredientBonus;
      factors.push({
        ingredient: marker,
        impact: 'positive',
        points: weights.wholeIngredientBonus,
        reason: 'Whole/natural ingredient',
      });
    }
  });

  const rawScore = Math.max(0, Math.min(100, 100 - penalty + bonus));

  return {
    score: rawScore,
    riskLevel: rawScore >= 75 ? 'low' : rawScore >= 50 ? 'moderate' : rawScore >= 25 ? 'high' : 'very-high',
    factors: factors.sort((a, b) => a.points - b.points),
    additiveCount: additives.length,
  };
}
