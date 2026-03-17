import { useState, useEffect } from 'react';
import { Search, Filter, Utensils } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Ingredient {
  id: number;
  name: string;
  category: string | null;
  brand: string | null;
  nutrition: {
    energy_kcal: number;
    protein_g: number;
    total_fat_g: number;
    carbohydrate_g: number;
    fiber_g: number;
    sugars_g: number;
    sodium_mg: number;
  };
}

interface Category {
  name: string;
  count: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function IngredientBrowserPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryResults, setCategoryResults] = useState<Ingredient[]>([]);
  const [popularIngredients, setPopularIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadPopular();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/ingredients/categories`);
      const data = await response.json();
      setCategories(data.categories.slice(0, 20));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadPopular = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/ingredients/popular?limit=20`);
      const data = await response.json();
      setPopularIngredients(data.results);
    } catch (error) {
      console.error('Failed to load popular ingredients:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/ingredients/search?q=${encodeURIComponent(searchQuery)}&limit=50`
      );
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategory = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/ingredients/by-category/${encodeURIComponent(category)}?limit=50`
      );
      const data = await response.json();
      setCategoryResults(data.results);
    } catch (error) {
      console.error('Failed to load category:', error);
    } finally {
      setLoading(false);
    }
  };

  const IngredientCard = ({ ingredient }: { ingredient: Ingredient }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{ingredient.name}</CardTitle>
        {ingredient.category && (
          <Badge variant="outline" className="w-fit">{ingredient.category}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Calories:</span>
            <span className="ml-1 font-medium">{ingredient.nutrition.energy_kcal.toFixed(0)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Protein:</span>
            <span className="ml-1 font-medium">{ingredient.nutrition.protein_g.toFixed(1)}g</span>
          </div>
          <div>
            <span className="text-muted-foreground">Carbs:</span>
            <span className="ml-1 font-medium">{ingredient.nutrition.carbohydrate_g.toFixed(1)}g</span>
          </div>
          <div>
            <span className="text-muted-foreground">Fat:</span>
            <span className="ml-1 font-medium">{ingredient.nutrition.total_fat_g.toFixed(1)}g</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Utensils className="h-8 w-8" />
          Ingredient Database
        </h1>
        <p className="text-muted-foreground">
          Browse 1.5M+ ingredients with complete nutrition information
        </p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Search ingredients (e.g., chicken breast, brown rice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search Results</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          {searchResults.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Found {searchResults.length} results for "{searchQuery}"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((ingredient) => (
                  <IngredientCard key={ingredient.id} ingredient={ingredient} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Search for ingredients to see results</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => loadCategory(cat.name)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedCategory === cat.name
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate">{cat.name}</span>
                        <Badge variant="secondary" className="ml-2">{cat.count}</Badge>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              {categoryResults.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {categoryResults.length} items in {selectedCategory}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryResults.map((ingredient) => (
                      <IngredientCard key={ingredient.id} ingredient={ingredient} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a category to browse ingredients</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Most commonly used ingredients
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularIngredients.map((ingredient) => (
              <IngredientCard key={ingredient.id} ingredient={ingredient} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
