import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Zap, RefreshCw, Lock } from 'lucide-react';
import { indianFoodAPI } from '../services/api';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SAMPLE_FOODS = [
  { name: '🥛 Paneer', protein_g: 18, fat_g: 20, carb_g: 1.2, fibre_g: 0, freesugar_g: 0, calcium_mg: 208, iron_mg: 0.2, sodium_mg: 18 },
  { name: '🍚 Rice', protein_g: 2.7, fat_g: 0.3, carb_g: 28, fibre_g: 0.4, freesugar_g: 0, calcium_mg: 10, iron_mg: 0.2, sodium_mg: 1 },
  { name: '🫘 Dal', protein_g: 9, fat_g: 0.5, carb_g: 20, fibre_g: 8, freesugar_g: 0, calcium_mg: 19, iron_mg: 3.3, sodium_mg: 5 },
  { name: '🥔 Aloo', protein_g: 2, fat_g: 0.1, carb_g: 17, fibre_g: 2.2, freesugar_g: 0.8, calcium_mg: 12, iron_mg: 0.8, sodium_mg: 6 },
];

export const IndianPredict = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [nutrients, setNutrients] = useState({
    protein_g: '',
    fat_g: '',
    carb_g: '',
    fibre_g: '',
    freesugar_g: '',
    calcium_mg: '',
    iron_mg: '',
    sodium_mg: '',
    // Additional fields
    magnesium_mg: '',
    phosphorus_mg: '',
    potassium_mg: '',
    zinc_mg: '',
    copper_mg: '',
    vita_ug: '',
    vitb1_mg: '',
    vitb2_mg: '',
    vitc_mg: '',
    vite_mg: '',
    cholesterol_mg: '',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const numericNutrients = Object.fromEntries(
        Object.entries(nutrients).map(([k, v]) => [k, parseFloat(v) || 0])
      );

      // Get all predictions in parallel
      const [calorieData, healthData, categoryData, similarData] = await Promise.all([
        indianFoodAPI.predictCalories(numericNutrients),
        indianFoodAPI.predictHealth({ ...numericNutrients, energy_kcal: 0 }),
        indianFoodAPI.analyze('Custom Food', numericNutrients),
        indianFoodAPI.findSimilar(numericNutrients, 5),
      ]);

      setResult({
        calories: calorieData.predicted_calories,
        health: healthData.health_labels,
        category: categoryData.category,
        similar_foods: similarData.similar_foods,
        insights: categoryData.insights,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fillSample = (sample: any) => {
    setNutrients({
      protein_g: sample.protein_g.toString(),
      fat_g: sample.fat_g.toString(),
      carb_g: sample.carb_g.toString(),
      fibre_g: sample.fibre_g.toString(),
      freesugar_g: sample.freesugar_g.toString(),
      calcium_mg: sample.calcium_mg.toString(),
      iron_mg: sample.iron_mg.toString(),
      sodium_mg: sample.sodium_mg.toString(),
    });
    setResult(null);
  };

  const clearAll = () => {
    setNutrients({
      protein_g: '',
      fat_g: '',
      carb_g: '',
      fibre_g: '',
      freesugar_g: '',
      calcium_mg: '',
      iron_mg: '',
      sodium_mg: '',
      magnesium_mg: '',
      phosphorus_mg: '',
      potassium_mg: '',
      zinc_mg: '',
      copper_mg: '',
      vita_ug: '',
      vitb1_mg: '',
      vitb2_mg: '',
      vitc_mg: '',
      vite_mg: '',
      cholesterol_mg: '',
    });
    setResult(null);
  };

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="bg-gradient-to-br from-orange-50 via-white to-green-50 min-h-screen flex items-center justify-center">
          <Card className="border-2 border-orange-200 shadow-xl max-w-md w-full mx-4">
            <CardContent className="pt-12 pb-12 text-center">
              <Lock className="w-16 h-16 mx-auto text-orange-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-6">Sign in to use the AI Nutrition Predictor and get calorie & health label predictions.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-orange-600 to-orange-500">Sign In</Button>
                <Button variant="outline" onClick={() => navigate('/register')} className="border-orange-300">Register</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-orange-50 via-white to-green-50 min-h-screen">
        <div className="container py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-10 h-10 text-orange-600" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  AI Nutrition Predictor
                </h1>
              </div>
              <p className="text-lg text-gray-600 mb-4">
                Enter macronutrients to predict calories and health labels using our 99.3% accurate ML model
              </p>
              <Badge className="bg-green-600 text-sm py-1 px-3 mb-2">Trained on 1,014 Indian Foods</Badge>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Data sourced from Anuvaad INDB 2024.11. Some entries may have inaccuracies.
              </p>
            </div>

            {/* Quick Fill Buttons */}
            <Card className="border-2 border-orange-200 shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Quick Fill Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SAMPLE_FOODS.map((sample, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      onClick={() => fillSample(sample)}
                      className="h-auto py-3 border-orange-300 hover:bg-orange-50"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{sample.name.split(' ')[0]}</div>
                        <div className="text-xs font-semibold">{sample.name.split(' ')[1]}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <Card className="border-2 border-orange-200 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Enter Nutrients (per 100g)</CardTitle>
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Macronutrients */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🥩</span> Macronutrients
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Protein (g) *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.protein_g}
                          onChange={(e) => setNutrients({ ...nutrients, protein_g: e.target.value })}
                          placeholder="12.5"
                          className="border-orange-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fat (g) *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.fat_g}
                          onChange={(e) => setNutrients({ ...nutrients, fat_g: e.target.value })}
                          placeholder="18.2"
                          className="border-orange-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Carbs (g) *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.carb_g}
                          onChange={(e) => setNutrients({ ...nutrients, carb_g: e.target.value })}
                          placeholder="8.3"
                          className="border-orange-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fiber (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.fibre_g}
                          onChange={(e) => setNutrients({ ...nutrients, fibre_g: e.target.value })}
                          placeholder="3.1"
                          className="border-orange-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Other Nutrients */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-lg">💎</span> Minerals & Sugar
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Free Sugar (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.freesugar_g}
                          onChange={(e) => setNutrients({ ...nutrients, freesugar_g: e.target.value })}
                          placeholder="2.0"
                          className="border-orange-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Calcium (mg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.calcium_mg}
                          onChange={(e) => setNutrients({ ...nutrients, calcium_mg: e.target.value })}
                          placeholder="250"
                          className="border-orange-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Iron (mg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.iron_mg}
                          onChange={(e) => setNutrients({ ...nutrients, iron_mg: e.target.value })}
                          placeholder="4.5"
                          className="border-orange-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Sodium (mg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={nutrients.sodium_mg}
                          onChange={(e) => setNutrients({ ...nutrients, sodium_mg: e.target.value })}
                          placeholder="450"
                          className="border-orange-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Advanced Fields Toggle */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full border-orange-300"
                  >
                    {showAdvanced ? '▲ Hide Advanced Fields' : '▼ Show More Nutrients (Optional)'}
                  </Button>

                  {/* Advanced Fields */}
                  {showAdvanced && (
                    <>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-lg">⚡</span> Additional Minerals
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Magnesium (mg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.magnesium_mg}
                              onChange={(e) => setNutrients({ ...nutrients, magnesium_mg: e.target.value })}
                              placeholder="50"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Phosphorus (mg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.phosphorus_mg}
                              onChange={(e) => setNutrients({ ...nutrients, phosphorus_mg: e.target.value })}
                              placeholder="150"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Potassium (mg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.potassium_mg}
                              onChange={(e) => setNutrients({ ...nutrients, potassium_mg: e.target.value })}
                              placeholder="300"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Zinc (mg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.zinc_mg}
                              onChange={(e) => setNutrients({ ...nutrients, zinc_mg: e.target.value })}
                              placeholder="1.5"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Copper (mg)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={nutrients.copper_mg}
                              onChange={(e) => setNutrients({ ...nutrients, copper_mg: e.target.value })}
                              placeholder="0.5"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Cholesterol (mg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.cholesterol_mg}
                              onChange={(e) => setNutrients({ ...nutrients, cholesterol_mg: e.target.value })}
                              placeholder="0"
                              className="border-orange-300"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-lg">🍊</span> Vitamins
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Vitamin A (µg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.vita_ug}
                              onChange={(e) => setNutrients({ ...nutrients, vita_ug: e.target.value })}
                              placeholder="100"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Vitamin B1 (mg)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={nutrients.vitb1_mg}
                              onChange={(e) => setNutrients({ ...nutrients, vitb1_mg: e.target.value })}
                              placeholder="0.1"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Vitamin B2 (mg)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={nutrients.vitb2_mg}
                              onChange={(e) => setNutrients({ ...nutrients, vitb2_mg: e.target.value })}
                              placeholder="0.15"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Vitamin C (mg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.vitc_mg}
                              onChange={(e) => setNutrients({ ...nutrients, vitc_mg: e.target.value })}
                              placeholder="10"
                              className="border-orange-300"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Vitamin E (mg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={nutrients.vite_mg}
                              onChange={(e) => setNutrients({ ...nutrients, vite_mg: e.target.value })}
                              placeholder="2"
                              className="border-orange-300"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Button 
                    onClick={handlePredict} 
                    disabled={loading || !nutrients.protein_g || !nutrients.fat_g || !nutrients.carb_g} 
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-lg"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Predicting...</>
                    ) : (
                      <><Sparkles className="w-5 h-5 mr-2" /> Predict with AI</>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">* Required fields</p>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="space-y-6">
                {result ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🔥</span>
                          Predicted Calories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-6xl font-black text-orange-600 mb-2">
                          {Math.round(result.calories)}
                        </div>
                        <div className="text-lg text-gray-700 mb-4">kcal per 100g</div>
                        <Badge className="bg-green-600 text-sm py-1 px-3">✓ 99.3% Accuracy</Badge>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200 shadow-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🏷️</span>
                          Health Labels
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">High Protein</span>
                          <Badge variant={result.health.high_protein ? 'default' : 'outline'} className={result.health.high_protein ? 'bg-green-600' : ''}>
                            {result.health.high_protein ? '✓ Yes' : '✗ No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">High Fiber</span>
                          <Badge variant={result.health.high_fiber ? 'default' : 'outline'} className={result.health.high_fiber ? 'bg-blue-600' : ''}>
                            {result.health.high_fiber ? '✓ Yes' : '✗ No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">Low Calorie</span>
                          <Badge variant={result.health.low_calorie ? 'default' : 'outline'} className={result.health.low_calorie ? 'bg-purple-600' : ''}>
                            {result.health.low_calorie ? '✓ Yes' : '✗ No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">High Sugar</span>
                          <Badge variant={result.health.high_sugar ? 'default' : 'outline'} className={result.health.high_sugar ? 'bg-red-600' : ''}>
                            {result.health.high_sugar ? '⚠ Yes' : '✓ No'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🏷️</span>
                          Predicted Category
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-700 mb-2">
                          {result.category}
                        </div>
                        <Badge className="bg-blue-600 text-sm py-1 px-3">✓ 78.8% Accuracy</Badge>
                      </CardContent>
                    </Card>

                    {result.similar_foods && result.similar_foods.length > 0 && (
                      <Card className="border-2 border-purple-200 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">🔍</span>
                            Similar Indian Foods
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-2">
                            Based on nutritional similarity within the same category. Click any food to auto-fill its nutrients.
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {result.similar_foods.map((food: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => {
                                if (food.nutrients) {
                                  setNutrients({
                                    protein_g: food.nutrients.protein_g?.toString() || '',
                                    fat_g: food.nutrients.fat_g?.toString() || '',
                                    carb_g: food.nutrients.carb_g?.toString() || '',
                                    fibre_g: food.nutrients.fibre_g?.toString() || '',
                                    freesugar_g: food.nutrients.freesugar_g?.toString() || '',
                                    calcium_mg: food.nutrients.calcium_mg?.toString() || '',
                                    iron_mg: food.nutrients.iron_mg?.toString() || '',
                                    sodium_mg: food.nutrients.sodium_mg?.toString() || '',
                                    magnesium_mg: '',
                                    phosphorus_mg: '',
                                    potassium_mg: '',
                                    zinc_mg: '',
                                    copper_mg: '',
                                    vita_ug: '',
                                    vitb1_mg: '',
                                    vitb2_mg: '',
                                    vitc_mg: '',
                                    vite_mg: '',
                                    cholesterol_mg: '',
                                  });
                                  setResult(null);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer"
                            >
                              <span className="font-medium text-gray-800">{food.food_name}</span>
                              <Badge variant="outline" className="text-purple-700 border-purple-300">{food.category}</Badge>
                            </button>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {result.insights && result.insights.length > 0 && (
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">💡</span>
                            Nutritional Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {result.insights.map((insight: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-700">
                          <strong>🤖 Model Info:</strong> Predictions powered by Gradient Boosting Classifier trained on 1,014 Indian foods with 78.8% category accuracy and 99.3% R² for calorie prediction.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="border-2 border-dashed border-gray-300 h-full flex items-center justify-center">
                    <CardContent className="text-center py-20">
                      <Sparkles className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No predictions yet</p>
                      <p className="text-gray-400 text-sm">
                        Fill in the nutrient values or use quick fill examples
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};
