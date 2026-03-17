import { useState } from 'react';
import { Loader2, Search, Utensils, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface NutritionData {
  energy_kcal: number;
  protein_g: number;
  total_fat_g: number;
  carbohydrate_g: number;
  fiber_g: number;
  sugars_g: number;
  sodium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  saturated_fat_g: number;
  cholesterol_mg: number;
}

interface IngredientMatch {
  name: string;
  confidence: number;
  nutrition: NutritionData;
  category?: string;
  brand?: string;
}

interface AnalysisResult {
  total_ingredients: number;
  matched_ingredients: number;
  unmatched_ingredients: string[];
  aggregated_nutrition: NutritionData;
  per_ingredient_results: Array<{
    ingredient: string;
    best_match: IngredientMatch | null;
  }>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeader() {
  const tokens = JSON.parse(localStorage.getItem('foodintel_auth_tokens') || 'null');
  return tokens?.accessToken ? { 'Authorization': `Bearer ${tokens.accessToken}` } : {};
}

export default function NutritionLookupPage() {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  
  // Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{name: string; category: string | null}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Browse database
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseResults, setBrowseResults] = useState<Array<{name: string; category: string | null}>>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotal, setBrowseTotal] = useState(0);
  const pageSize = 50;

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/ingredients/autocomplete?q=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions?.length > 0);
    } catch (err) {
      console.error('Autocomplete failed:', err);
    }
  };

  const addIngredient = (name: string) => {
    const current = ingredients.trim();
    setIngredients(current ? `${current}\n${name}` : name);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const browseIngredients = async (page = 1, search = '') => {
    setBrowseLoading(true);
    try {
      const url = search
        ? `${API_BASE}/api/ingredients/search?q=${encodeURIComponent(search)}&limit=${pageSize}&offset=${(page - 1) * pageSize}`
        : `${API_BASE}/api/ingredients/search?limit=${pageSize}&offset=${(page - 1) * pageSize}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setBrowseResults(data.results || []);
      setBrowseTotal(data.total || 0);
      setBrowsePage(page);
    } catch (err) {
      console.error('Browse failed:', err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleBrowseOpen = () => {
    setBrowseOpen(true);
    if (browseResults.length === 0) {
      browseIngredients(1, '');
    }
  };

  const handleBrowseSearch = () => {
    browseIngredients(1, browseSearch);
  };

  const addFromBrowse = (name: string) => {
    addIngredient(name);
    setBrowseOpen(false);
  };

  const analyzeIngredients = async () => {
    if (!ingredients.trim()) {
      setError('Please enter ingredients');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`${API_BASE}/api/nutrition/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ingredients: ingredients.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze ingredients');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Utensils className="h-8 w-8" />
          Nutrition Lookup
        </h1>
        <p className="text-muted-foreground">
          Enter ingredients to get detailed nutrition information from 1.5M+ foods
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Add Ingredient</CardTitle>
          <CardDescription>
            Search and add ingredients with autocomplete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
                placeholder="Type to search ingredients (e.g., chicken, rice, broccoli)..."
                className="pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => addIngredient(suggestion.name)}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm">{suggestion.name}</span>
                      {suggestion.category && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleBrowseOpen}>
                  <Database className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Browse Ingredient Database</DialogTitle>
                  <DialogDescription>
                    Search and browse through 1.5M+ ingredients
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex gap-2 mb-4">
                  <Input
                    value={browseSearch}
                    onChange={(e) => setBrowseSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBrowseSearch()}
                    placeholder="Search ingredients..."
                  />
                  <Button onClick={handleBrowseSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                  {browseLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="divide-y">
                      {browseResults.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => addFromBrowse(item.name)}
                          className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm">{item.name}</span>
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(browsePage - 1) * pageSize + 1}-{Math.min(browsePage * pageSize, browseTotal)} of {browseTotal}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => browseIngredients(browsePage - 1, browseSearch)}
                      disabled={browsePage === 1 || browseLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => browseIngredients(browsePage + 1, browseSearch)}
                      disabled={browsePage * pageSize >= browseTotal || browseLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Ingredients</CardTitle>
          <CardDescription>
            Separate ingredients with commas or new lines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Example:&#10;chicken breast&#10;brown rice&#10;broccoli&#10;olive oil"
            rows={6}
            className="mb-4"
          />
          <Button onClick={analyzeIngredients} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze Ingredients
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {results && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Aggregated Nutrition Facts</CardTitle>
              <CardDescription>
                Average nutrition per 100g serving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{results.aggregated_nutrition.energy_kcal.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{results.aggregated_nutrition.protein_g.toFixed(1)}g</div>
                  <div className="text-sm text-muted-foreground">Protein</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{results.aggregated_nutrition.carbohydrate_g.toFixed(1)}g</div>
                  <div className="text-sm text-muted-foreground">Carbs</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{results.aggregated_nutrition.total_fat_g.toFixed(1)}g</div>
                  <div className="text-sm text-muted-foreground">Fat</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div className="flex justify-between p-2 border-b">
                  <span className="text-sm">Fiber</span>
                  <span className="font-medium">{results.aggregated_nutrition.fiber_g.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-sm">Sugars</span>
                  <span className="font-medium">{results.aggregated_nutrition.sugars_g.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-sm">Sodium</span>
                  <span className="font-medium">{results.aggregated_nutrition.sodium_mg.toFixed(0)}mg</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-sm">Calcium</span>
                  <span className="font-medium">{results.aggregated_nutrition.calcium_mg.toFixed(0)}mg</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-sm">Iron</span>
                  <span className="font-medium">{results.aggregated_nutrition.iron_mg.toFixed(1)}mg</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-sm">Cholesterol</span>
                  <span className="font-medium">{results.aggregated_nutrition.cholesterol_mg.toFixed(0)}mg</span>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                <Badge variant="outline">
                  {results.matched_ingredients}/{results.total_ingredients} matched
                </Badge>
                {results.unmatched_ingredients.length > 0 && (
                  <Badge variant="secondary">
                    {results.unmatched_ingredients.length} unmatched
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingredient Details</CardTitle>
              <CardDescription>
                Individual nutrition information for each ingredient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.per_ingredient_results.map((result, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{result.ingredient}</h4>
                        {result.best_match && (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {result.best_match.name}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={result.best_match.confidence > 0.5 ? 'default' : 'secondary'}>
                                {(result.best_match.confidence * 100).toFixed(0)}% match
                              </Badge>
                              {result.best_match.category && (
                                <Badge variant="outline">{result.best_match.category}</Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {result.best_match ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Calories: </span>
                          <span className="font-medium">{result.best_match.nutrition.energy_kcal.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Protein: </span>
                          <span className="font-medium">{result.best_match.nutrition.protein_g.toFixed(1)}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carbs: </span>
                          <span className="font-medium">{result.best_match.nutrition.carbohydrate_g.toFixed(1)}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fat: </span>
                          <span className="font-medium">{result.best_match.nutrition.total_fat_g.toFixed(1)}g</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">No match found</p>
                    )}
                  </div>
                ))}
              </div>

              {results.unmatched_ingredients.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Unmatched Ingredients</h4>
                  <p className="text-sm text-muted-foreground">
                    {results.unmatched_ingredients.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
