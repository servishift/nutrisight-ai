// Additive detection engine — identifies preservatives, colors, flavors, etc.

import type { Additive } from '@/types/ingredient';

export interface AdditiveEntry {
  name: string;
  type: 'preservative' | 'color' | 'flavor' | 'sweetener' | 'emulsifier' | 'stabilizer' | 'antioxidant';
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  keywords: string[];
}

const ADDITIVE_DATABASE: AdditiveEntry[] = [
  // Preservatives
  { name: 'Sodium Benzoate', type: 'preservative', riskLevel: 'medium', description: 'Common preservative linked to hyperactivity when combined with colors', keywords: ['sodium benzoate', 'e211'] },
  { name: 'Potassium Sorbate', type: 'preservative', riskLevel: 'low', description: 'Widely used preservative, generally recognized as safe', keywords: ['potassium sorbate', 'e202'] },
  { name: 'Sodium Nitrite', type: 'preservative', riskLevel: 'high', description: 'Used in processed meats, linked to carcinogenic nitrosamines', keywords: ['sodium nitrite', 'e250', 'sodium nitrate', 'e251'] },
  { name: 'BHA', type: 'antioxidant', riskLevel: 'high', description: 'Butylated hydroxyanisole — potential endocrine disruptor', keywords: ['bha', 'butylated hydroxyanisole', 'e320'] },
  { name: 'BHT', type: 'antioxidant', riskLevel: 'medium', description: 'Butylated hydroxytoluene — synthetic antioxidant', keywords: ['bht', 'butylated hydroxytoluene', 'e321'] },
  { name: 'TBHQ', type: 'antioxidant', riskLevel: 'medium', description: 'Tertiary butylhydroquinone — petrochemical-derived preservative', keywords: ['tbhq', 'e319'] },
  { name: 'Sulfites', type: 'preservative', riskLevel: 'medium', description: 'Can trigger asthma and allergic reactions', keywords: ['sulfite', 'sulphite', 'sulfur dioxide', 'sodium bisulfite', 'sodium metabisulfite', 'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228'] },

  // Colors
  { name: 'Tartrazine (Yellow 5)', type: 'color', riskLevel: 'high', description: 'Azo dye linked to hyperactivity in children', keywords: ['tartrazine', 'yellow 5', 'e102', 'fd&c yellow no. 5'] },
  { name: 'Sunset Yellow (Yellow 6)', type: 'color', riskLevel: 'high', description: 'Synthetic azo dye, banned in some countries', keywords: ['sunset yellow', 'yellow 6', 'e110', 'fd&c yellow no. 6'] },
  { name: 'Allura Red (Red 40)', type: 'color', riskLevel: 'high', description: 'Most widely used food dye, linked to behavioral issues', keywords: ['allura red', 'red 40', 'e129', 'fd&c red no. 40'] },
  { name: 'Brilliant Blue (Blue 1)', type: 'color', riskLevel: 'medium', description: 'Synthetic dye derived from petroleum', keywords: ['brilliant blue', 'blue 1', 'e133', 'fd&c blue no. 1'] },
  { name: 'Caramel Color', type: 'color', riskLevel: 'medium', description: 'Some types contain 4-MEI, a potential carcinogen', keywords: ['caramel color', 'caramel colour', 'e150'] },

  // Flavor enhancers
  { name: 'MSG', type: 'flavor', riskLevel: 'medium', description: 'Monosodium glutamate — can cause sensitivity reactions', keywords: ['monosodium glutamate', 'msg', 'e621'] },
  { name: 'Disodium Inosinate', type: 'flavor', riskLevel: 'low', description: 'Often used with MSG as synergistic flavor enhancer', keywords: ['disodium inosinate', 'e631'] },

  // Sweeteners
  { name: 'Aspartame', type: 'sweetener', riskLevel: 'medium', description: 'Artificial sweetener — IARC classified as possible carcinogen', keywords: ['aspartame', 'e951'] },
  { name: 'Sucralose', type: 'sweetener', riskLevel: 'low', description: 'Non-caloric sweetener, 600x sweeter than sugar', keywords: ['sucralose', 'e955'] },
  { name: 'Acesulfame K', type: 'sweetener', riskLevel: 'medium', description: 'Often combined with other sweeteners, limited long-term studies', keywords: ['acesulfame', 'acesulfame potassium', 'ace-k', 'e950'] },
  { name: 'High Fructose Corn Syrup', type: 'sweetener', riskLevel: 'high', description: 'Linked to obesity, diabetes, and metabolic syndrome', keywords: ['high fructose corn syrup', 'hfcs', 'corn syrup'] },

  // Emulsifiers
  { name: 'Carrageenan', type: 'emulsifier', riskLevel: 'medium', description: 'Seaweed-derived, linked to gut inflammation in studies', keywords: ['carrageenan', 'e407'] },
  { name: 'Polysorbate 80', type: 'emulsifier', riskLevel: 'medium', description: 'Synthetic emulsifier, may affect gut microbiome', keywords: ['polysorbate 80', 'e433'] },
  { name: 'Soy Lecithin', type: 'emulsifier', riskLevel: 'low', description: 'Common emulsifier from soybeans, generally safe', keywords: ['soy lecithin', 'e322'] },

  // Stabilizers
  { name: 'Xanthan Gum', type: 'stabilizer', riskLevel: 'low', description: 'Fermented sugar product, generally recognized as safe', keywords: ['xanthan gum', 'e415'] },
  { name: 'Guar Gum', type: 'stabilizer', riskLevel: 'low', description: 'Natural thickener from guar beans', keywords: ['guar gum', 'e412'] },
];

export function detectAdditives(ingredientText: string): Additive[] {
  const normalized = ingredientText.toLowerCase();

  return ADDITIVE_DATABASE
    .map((entry) => {
      const matchedKeywords = entry.keywords.filter((kw) =>
        normalized.includes(kw.toLowerCase())
      );
      if (matchedKeywords.length === 0) return null;

      return {
        name: entry.name,
        type: entry.type,
        riskLevel: entry.riskLevel,
        description: entry.description,
        matchedKeywords,
      };
    })
    .filter(Boolean) as Additive[];
}

export function getAdditiveSummary(additives: Additive[]) {
  const byType: Record<string, number> = {};
  const byRisk: Record<string, number> = { high: 0, medium: 0, low: 0 };

  additives.forEach((a) => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    byRisk[a.riskLevel]++;
  });

  return { byType, byRisk, total: additives.length };
}
