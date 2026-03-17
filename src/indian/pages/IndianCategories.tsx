import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { indianFoodAPI } from '../services/api';

const CATEGORY_ICONS: Record<string, string> = {
  'Beverages': '🍵',
  'Dairy Products': '🥛',
  'Fruits': '🍎',
  'Grains & Cereals': '🌾',
  'Meat & Seafood': '🍖',
  'Other': '🍽️',
  'Pulses & Legumes': '🫘',
  'Snacks & Sweets': '🍬',
  'Spices & Condiments': '🌶️',
  'Vegetables': '🥬',
};

export const IndianCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    indianFoodAPI.getCategories().then((data) => {
      setCategories(data.categories);
      if (data.categories.length > 0) {
        setSelectedCategory(data.categories[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setLoading(true);
      indianFoodAPI.getCategoryFoods(selectedCategory)
        .then((data) => setFoods(data.results))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse by Category</h1>
        <p className="text-muted-foreground">Explore Indian foods organized by category</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-8">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              <span className="mr-1">{CATEGORY_ICONS[cat]}</span>
              <span className="hidden lg:inline">{cat.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat}>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-orange-600" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">{CATEGORY_ICONS[cat]}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{cat}</h2>
                    <p className="text-muted-foreground">{foods.length} items</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foods.map((food, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base">{food.food_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-2xl font-bold text-orange-600">{Math.round(food.energy_kcal)}</div>
                          <div className="text-xs text-muted-foreground">kcal/100g</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Protein</div>
                            <div className="font-medium">{food.protein_g?.toFixed(1)}g</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Fat</div>
                            <div className="font-medium">{food.fat_g?.toFixed(1)}g</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Carbs</div>
                            <div className="font-medium">{food.carb_g?.toFixed(1)}g</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {food.high_protein && <Badge className="text-xs bg-green-600">High Protein</Badge>}
                          {food.high_fiber && <Badge className="text-xs bg-blue-600">High Fiber</Badge>}
                          {food.low_calorie && <Badge className="text-xs bg-purple-600">Low Cal</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
