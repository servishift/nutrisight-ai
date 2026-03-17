import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Sparkles, TrendingUp, AlertCircle, Lock } from 'lucide-react';
import { indianFoodAPI } from '../services/api';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const IndianAnalyzer = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await indianFoodAPI.getFood(query);
      setResult(data);
      toast({
        title: "✅ Food Found!",
        description: `Loaded nutrition data for ${data.food_name}`,
      });
    } catch (err) {
      console.error(err);
      setError('Food not found. Try searching for common Indian foods like "paneer", "dal", or "biryani"');
      toast({
        title: "❌ Not Found",
        description: "Food not found in database. Try a different search term.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="bg-gradient-to-br from-orange-50 via-white to-green-50 min-h-screen flex items-center justify-center">
          <Card className="border-2 border-orange-200 shadow-xl max-w-md w-full mx-4">
            <CardContent className="pt-12 pb-12 text-center">
              <Lock className="w-16 h-16 mx-auto text-orange-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-6">Sign in to use the AI Food Analyzer and get detailed nutrition insights.</p>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-10 h-10 text-orange-600" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  🇮🇳 Indian Food Analyzer
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Search 1,014 Indian foods with AI-powered nutrition analysis
              </p>
            </div>

            {/* Search Bar */}
            <Card className="border-2 border-orange-200 shadow-xl mb-8">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g. paneer, dal makhani, biryani, samosa..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    className="flex-1 text-lg h-14 border-orange-300 focus:border-orange-500"
                  />
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={loading || !query.trim()} 
                    size="lg" 
                    className="h-14 px-8 bg-gradient-to-r from-orange-600 to-orange-500"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Search Food</>}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-3">💡 Tip: Search by food name (e.g., "paneer tikka", "dal", "biryani")</p>
              </CardContent>
            </Card>

            {/* Results */}
            {loading && (
              <div className="text-center py-20">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-orange-600 mb-4" />
                <p className="text-lg text-gray-600">Analyzing...</p>
              </div>
            )}

            {!loading && result && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                {/* Food Header */}
                <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-3xl text-orange-600">{result.food_name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-orange-600">{result.category}</Badge>
                      <Badge variant="outline" className="border-orange-300">Indian Food Database • Anuvaad INDB 2024</Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Calories & Macros */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-5xl font-black text-red-600 mb-2">{Math.round(result.energy_kcal)}</div>
                      <div className="text-sm font-semibold text-red-700">kcal</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl mb-1">🥩</div>
                      <div className="text-3xl font-bold text-blue-700">{result.protein_g?.toFixed(1)}g</div>
                      <div className="text-xs text-blue-600">Protein</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl mb-1">🌾</div>
                      <div className="text-3xl font-bold text-amber-700">{result.carb_g?.toFixed(1)}g</div>
                      <div className="text-xs text-amber-600">Carbs</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl mb-1">🥑</div>
                      <div className="text-3xl font-bold text-green-700">{result.fat_g?.toFixed(1)}g</div>
                      <div className="text-xs text-green-600">Fat</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Health Labels */}
                {(result.high_protein === 1 || result.high_fiber === 1 || result.low_calorie === 1) && (
                  <Card className="border-2 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span>🏷️</span> Health Labels
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {result.high_protein === 1 && <Badge className="bg-green-600 text-sm py-1 px-3">High Protein</Badge>}
                        {result.high_fiber === 1 && <Badge className="bg-blue-600 text-sm py-1 px-3">High Fiber</Badge>}
                        {result.low_calorie === 1 && <Badge className="bg-purple-600 text-sm py-1 px-3">Low Calorie</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Nutrition */}
                <Card className="border-2 border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      📊 Detailed Nutrition Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Calories</span>
                        <span className="font-bold">{result.energy_kcal?.toFixed(1)} kcal</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Protein</span>
                        <span className="font-bold">{result.protein_g?.toFixed(1)} g</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Carbs</span>
                        <span className="font-bold">{result.carb_g?.toFixed(1)} g</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Fat</span>
                        <span className="font-bold">{result.fat_g?.toFixed(1)} g</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">⚡ Energy Density</span>
                        <span className="font-bold">{(result.energy_kcal / 100)?.toFixed(1)} kcal/g</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">🎯 Protein Ratio</span>
                        <span className="font-bold">{((result.protein_g / (result.protein_g + result.fat_g + result.carb_g)) * 100)?.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Minerals */}
                    <div>
                      <h4 className="font-semibold mb-2">💎 Minerals & Fiber</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between p-2 bg-blue-50 rounded">
                          <span>Fiber</span>
                          <span className="font-bold">{result.fibre_g?.toFixed(1) || '0.0'}g</span>
                        </div>
                        <div className="flex justify-between p-2 bg-blue-50 rounded">
                          <span>Calcium</span>
                          <span className="font-bold">{result.calcium_mg?.toFixed(1) || '0.0'}mg</span>
                        </div>
                        <div className="flex justify-between p-2 bg-blue-50 rounded">
                          <span>Iron</span>
                          <span className="font-bold">{result.iron_mg?.toFixed(1) || '0.0'}mg</span>
                        </div>
                        <div className="flex justify-between p-2 bg-blue-50 rounded">
                          <span>Sodium</span>
                          <span className="font-bold">{result.sodium_mg?.toFixed(1) || '0.0'}mg</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error State */}
            {!loading && error && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                  <p className="text-xl font-semibold text-red-700 mb-2">Food not found</p>
                  <p className="text-red-600 mb-4">{error}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setQuery('paneer tikka')}>Try: Paneer Tikka</Button>
                    <Button variant="outline" size="sm" onClick={() => setQuery('dal makhani')}>Try: Dal Makhani</Button>
                    <Button variant="outline" size="sm" onClick={() => setQuery('biryani')}>Try: Biryani</Button>
                    <Button variant="outline" size="sm" onClick={() => setQuery('samosa')}>Try: Samosa</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !result && !query && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="pt-20 pb-20 text-center">
                  <Sparkles className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">🇮🇳 Search for Indian food to see nutrition analysis</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};
