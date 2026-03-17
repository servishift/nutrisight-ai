import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, TrendingUp, Flame, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { indianFoodAPI } from '../services/api';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  'All Categories',
  'Beverages',
  'Dairy Products',
  'Fruits',
  'Grains & Cereals',
  'Meat & Seafood',
  'Other',
  'Pulses & Legumes',
  'Snacks & Sweets',
  'Spices & Condiments',
  'Vegetables'
];

const ITEMS_PER_PAGE = 12;

export const IndianSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [allFoods, setAllFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'search' | 'browse'>('search');
  const [showMoreNutrients, setShowMoreNutrients] = useState(false);

  useEffect(() => {
    if (viewMode === 'browse') {
      loadAllFoods();
    }
  }, [viewMode, selectedCategory]);

  const loadAllFoods = async () => {
    setLoading(true);
    try {
      if (selectedCategory === 'All Categories') {
        const data = await indianFoodAPI.search('', 1014);
        setAllFoods(data.results);
      } else {
        const data = await indianFoodAPI.getCategoryFoods(selectedCategory, 200);
        setAllFoods(data.results);
      }
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setViewMode('search');
    try {
      const data = await indianFoodAPI.search(query);
      setResults(data.results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const displayedFoods = viewMode === 'search' ? results : allFoods;
  const totalPages = Math.ceil(displayedFoods.length / ITEMS_PER_PAGE);
  const paginatedFoods = displayedFoods.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-orange-50 via-white to-green-50 min-h-screen">
        <div className="container py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                🇮🇳 Indian Food Database
              </h1>
              <p className="text-lg text-gray-600">Search or browse 1,014 authentic Indian foods</p>
            </div>

            {/* Search & Filter Bar */}
            <Card className="border-2 border-orange-200 shadow-xl mb-8">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <Input
                    placeholder="Search for dal, roti, paneer, biryani..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 text-lg h-12 border-orange-300 focus:border-orange-500"
                  />
                  <Button onClick={handleSearch} disabled={loading} size="lg" className="h-12 px-6 bg-gradient-to-r from-orange-600 to-orange-500">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Search</>}
                  </Button>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setViewMode('browse'); }}>
                    <SelectTrigger className="w-full md:w-64 border-orange-300">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setViewMode('browse')} className="border-orange-300">
                    Browse All Foods
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Loading */}
            {loading && (
              <div className="text-center py-20">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-orange-600 mb-4" />
                <p className="text-lg text-gray-600">Loading...</p>
              </div>
            )}

            {/* Results */}
            {!loading && displayedFoods.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-lg font-semibold text-gray-700">
                    <TrendingUp className="w-5 h-5 inline mr-2 text-green-600" />
                    {viewMode === 'search' ? `Found ${displayedFoods.length} results` : `Showing ${displayedFoods.length} foods`}
                    {selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
                  </p>
                  <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {paginatedFoods.map((food, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card 
                        className="hover:shadow-xl transition-all cursor-pointer border-2 border-gray-200 hover:border-orange-300 h-full"
                        onClick={() => setSelectedFood(food)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 border border-orange-200">
                              <Flame className="w-5 h-5 text-orange-600" />
                              <div className="text-xl font-black text-orange-600">{Math.round(food.energy_kcal)}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-2">{food.food_name}</h3>
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">{food.category}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-center">
                            <div className="bg-blue-50 rounded p-1">
                              <div className="font-bold text-blue-700">{food.protein_g?.toFixed(1)}g</div>
                              <div className="text-blue-600">Protein</div>
                            </div>
                            <div className="bg-amber-50 rounded p-1">
                              <div className="font-bold text-amber-700">{food.carb_g?.toFixed(1)}g</div>
                              <div className="text-amber-600">Carbs</div>
                            </div>
                            <div className="bg-green-50 rounded p-1">
                              <div className="font-bold text-green-700">{food.fat_g?.toFixed(1)}g</div>
                              <div className="text-green-600">Fat</div>
                            </div>
                          </div>
                          {(food.high_protein || food.high_fiber || food.low_calorie) && (
                            <div className="flex gap-1 mt-2">
                              {food.high_protein === 1 && <Badge className="bg-green-600 text-xs">HP</Badge>}
                              {food.high_fiber === 1 && <Badge className="bg-blue-600 text-xs">HF</Badge>}
                              {food.low_calorie === 1 && <Badge className="bg-purple-600 text-xs">LC</Badge>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                      if (pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? 'bg-orange-600' : ''}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {!loading && viewMode === 'search' && results.length === 0 && query && (
              <Card className="border-2 border-orange-200">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">No results found for "{query}"</p>
                  <p className="text-gray-500">Try browsing by category or search for common foods</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Food Details Modal */}
      <Dialog open={!!selectedFood} onOpenChange={() => { setSelectedFood(null); setShowMoreNutrients(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedFood && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-orange-600">{selectedFood.food_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                    <CardContent className="pt-6 text-center">
                      <Flame className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-4xl font-black text-orange-600">{Math.round(selectedFood.energy_kcal)}</div>
                      <div className="text-sm font-semibold text-orange-700">Calories (kcal)</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl mb-2">🏷️</div>
                      <div className="text-xl font-bold text-green-700">{selectedFood.category}</div>
                      <div className="text-sm font-semibold text-green-600">Category</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-3">Macronutrients</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4 text-center">
                        <div className="text-3xl mb-1">🥩</div>
                        <div className="text-2xl font-bold text-blue-700">{selectedFood.protein_g?.toFixed(1)}g</div>
                        <div className="text-xs text-blue-600">Protein</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="pt-4 text-center">
                        <div className="text-3xl mb-1">🍞</div>
                        <div className="text-2xl font-bold text-amber-700">{selectedFood.carb_g?.toFixed(1)}g</div>
                        <div className="text-xs text-amber-600">Carbs</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-4 text-center">
                        <div className="text-3xl mb-1">🥑</div>
                        <div className="text-2xl font-bold text-green-700">{selectedFood.fat_g?.toFixed(1)}g</div>
                        <div className="text-xs text-green-600">Fat</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>💎</span> Minerals & Fiber
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Fiber</span><span className="font-bold">{selectedFood.fibre_g?.toFixed(1) || '0.0'}g</span></div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Calcium</span><span className="font-bold">{selectedFood.calcium_mg?.toFixed(1) || '0.0'}mg</span></div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Iron</span><span className="font-bold">{selectedFood.iron_mg?.toFixed(1) || '0.0'}mg</span></div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Sodium</span><span className="font-bold">{selectedFood.sodium_mg?.toFixed(1) || '0.0'}mg</span></div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMoreNutrients(!showMoreNutrients)}
                    className="w-full mt-4 border-orange-300 hover:bg-orange-50"
                  >
                    {showMoreNutrients ? '▲ Hide Additional Nutrients' : '▼ Show All Nutrients (Vitamins, Minerals & More)'}
                  </Button>
                  
                  {showMoreNutrients && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-gray-700">Additional Minerals</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Magnesium</span><span className="font-bold">{selectedFood.magnesium_mg?.toFixed(1) || '0.0'}mg</span></div>
                          <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Phosphorus</span><span className="font-bold">{selectedFood.phosphorus_mg?.toFixed(1) || '0.0'}mg</span></div>
                          <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Potassium</span><span className="font-bold">{selectedFood.potassium_mg?.toFixed(1) || '0.0'}mg</span></div>
                          <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Zinc</span><span className="font-bold">{selectedFood.zinc_mg?.toFixed(1) || '0.0'}mg</span></div>
                          {(selectedFood.copper_mg || 0) > 0 && <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Copper</span><span className="font-bold">{selectedFood.copper_mg?.toFixed(2)}mg</span></div>}
                          {(selectedFood.selenium_ug || 0) > 0 && <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Selenium</span><span className="font-bold">{selectedFood.selenium_ug?.toFixed(1)}µg</span></div>}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-gray-700">Vitamins</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {(selectedFood.vita_ug || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Vitamin A</span><span className="font-bold">{selectedFood.vita_ug?.toFixed(1)}µg</span></div>}
                          {(selectedFood.vitb1_mg || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Vitamin B1</span><span className="font-bold">{selectedFood.vitb1_mg?.toFixed(2)}mg</span></div>}
                          {(selectedFood.vitb2_mg || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Vitamin B2</span><span className="font-bold">{selectedFood.vitb2_mg?.toFixed(2)}mg</span></div>}
                          {(selectedFood.vitb3_mg || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Vitamin B3</span><span className="font-bold">{selectedFood.vitb3_mg?.toFixed(2)}mg</span></div>}
                          {(selectedFood.vitb6_mg || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Vitamin B6</span><span className="font-bold">{selectedFood.vitb6_mg?.toFixed(2)}mg</span></div>}
                          {(selectedFood.vitc_mg || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Vitamin C</span><span className="font-bold">{selectedFood.vitc_mg?.toFixed(1)}mg</span></div>}
                          {(selectedFood.vite_mg || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Vitamin E</span><span className="font-bold">{selectedFood.vite_mg?.toFixed(1)}mg</span></div>}
                          {(selectedFood.folate_ug || 0) > 0 && <div className="flex justify-between p-2 bg-orange-50 rounded"><span>Folate (B9)</span><span className="font-bold">{selectedFood.folate_ug?.toFixed(1)}µg</span></div>}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-gray-700">Other Nutrients</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between p-2 bg-green-50 rounded"><span>Free Sugar</span><span className="font-bold">{selectedFood.freesugar_g?.toFixed(1) || '0.0'}g</span></div>
                          {(selectedFood.cholesterol_mg || 0) > 0 && <div className="flex justify-between p-2 bg-green-50 rounded"><span>Cholesterol</span><span className="font-bold">{selectedFood.cholesterol_mg?.toFixed(1)}mg</span></div>}
                          {(selectedFood.sfa_mg || 0) > 0 && <div className="flex justify-between p-2 bg-green-50 rounded"><span>Saturated Fat</span><span className="font-bold">{(selectedFood.sfa_mg/1000)?.toFixed(1)}g</span></div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(selectedFood.high_protein === 1 || selectedFood.high_fiber === 1 || selectedFood.low_calorie === 1) && (
                  <div>
                    <h3 className="text-lg font-bold mb-3">Health Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFood.high_protein === 1 && <Badge className="bg-green-600 text-lg py-2 px-4">✨ High Protein</Badge>}
                      {selectedFood.high_fiber === 1 && <Badge className="bg-blue-600 text-lg py-2 px-4">🌾 High Fiber</Badge>}
                      {selectedFood.low_calorie === 1 && <Badge className="bg-purple-600 text-lg py-2 px-4">🎯 Low Calorie</Badge>}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center pt-4 border-t">
                  Source: Anuvaad INDB 2024.11 | Food Code: {selectedFood.food_code}
                  {selectedFood.fat_g > 80 && (
                    <div className="mt-2 text-yellow-600 font-semibold">
                      ⚠️ Data Quality Alert: Fat content seems unusually high. Please verify with other sources.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};
