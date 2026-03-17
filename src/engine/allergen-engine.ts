// Allergen detection engine — real logic, not mock data
// Uses keyword matching (Phase 1), upgradeable to ML model

import type { Allergen } from '@/types/ingredient';

const ALLERGEN_DATABASE: Omit<Allergen, 'detected' | 'matchedKeywords'>[] = [
  {
    name: 'Wheat/Gluten',
    keywords: ['wheat', 'gluten', 'flour', 'semolina', 'durum', 'spelt', 'kamut', 'farina', 'couscous', 'bulgur', 'seitan'],
    severity: 'high',
  },
  {
    name: 'Milk/Dairy',
    keywords: ['milk', 'cream', 'butter', 'cheese', 'whey', 'casein', 'lactose', 'yogurt', 'ghee', 'curd'],
    severity: 'high',
  },
  {
    name: 'Soy',
    keywords: ['soy', 'soya', 'soybean', 'edamame', 'tofu', 'tempeh', 'miso', 'soy lecithin', 'soy protein'],
    severity: 'high',
  },
  {
    name: 'Egg',
    keywords: ['egg', 'albumin', 'globulin', 'lysozyme', 'mayonnaise', 'meringue', 'ovalbumin', 'ovomucin'],
    severity: 'high',
  },
  {
    name: 'Tree Nuts',
    keywords: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'macadamia', 'hazelnut', 'brazil nut', 'chestnut', 'pine nut'],
    severity: 'high',
  },
  {
    name: 'Peanut',
    keywords: ['peanut', 'groundnut', 'arachis'],
    severity: 'high',
  },
  {
    name: 'Fish',
    keywords: ['fish', 'cod', 'salmon', 'tuna', 'anchovy', 'sardine', 'tilapia', 'bass', 'trout'],
    severity: 'medium',
  },
  {
    name: 'Shellfish',
    keywords: ['shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'crawfish', 'prawn'],
    severity: 'medium',
  },
  {
    name: 'Sesame',
    keywords: ['sesame', 'tahini', 'halvah'],
    severity: 'medium',
  },
  {
    name: 'Sulfites',
    keywords: ['sulfite', 'sulphite', 'sulfur dioxide', 'sodium bisulfite', 'sodium metabisulfite', 'potassium bisulfite'],
    severity: 'low',
  },
];

export function detectAllergens(ingredientText: string): Allergen[] {
  const normalizedText = ingredientText.toLowerCase();

  return ALLERGEN_DATABASE.map((allergen) => {
    const matchedKeywords = allergen.keywords.filter((keyword) =>
      normalizedText.includes(keyword.toLowerCase())
    );

    return {
      ...allergen,
      detected: matchedKeywords.length > 0,
      matchedKeywords,
    };
  });
}
