import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageLayout from '@/components/layout/PageLayout';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import { Loader2 } from 'lucide-react';

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4'];

export default function FrequencyAnalysisPage() {
  const { data: topIngredients, isLoading: loadingTop } = useQuery({
    queryKey: ['topIngredients'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/frequency/top-ingredients?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  const { data: categoryData, isLoading: loadingCategory } = useQuery({
    queryKey: ['categoryAnalysis'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/frequency/category-analysis`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  if (loadingTop || loadingCategory) {
    return (
      <PageLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  const top20 = topIngredients?.ingredients.slice(0, 20) || [];
  const top10Categories = categoryData?.categories.slice(0, 10) || [];

  return (
    <PageLayout>
      <div className="container py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">Ingredient Frequency Analysis</h1>
          <DatabaseToggle />
        </div>

        {/* Top 20 Ingredients */}
        <div className="card-elevated mb-8 p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Top 20 Most Common Ingredients</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top20}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ingredient" angle={-45} textAnchor="end" height={120} fontSize={11} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 50 Table */}
        <div className="card-elevated mb-8 p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Top 50 Ingredients</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Ingredient</th>
                  <th className="p-2 text-right">Count</th>
                  <th className="p-2 text-right">Products</th>
                  <th className="p-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {topIngredients?.ingredients.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2 font-medium">{item.ingredient}</td>
                    <td className="p-2 text-right">{item.count.toLocaleString()}</td>
                    <td className="p-2 text-right">{item.products.toLocaleString()}</td>
                    <td className="p-2 text-right">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Analysis */}
        <div className="card-elevated p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Category-wise Analysis</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top10Categories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={120} fontSize={11} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="productCount" fill="#6366f1" name="Products" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top10Categories.map((cat: any, idx: number) => (
              <div key={idx} className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="mb-2 font-semibold text-sm">{cat.category}</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Products: {cat.productCount}</p>
                  <p>Avg Ingredients: {cat.avgIngredientsPerProduct}</p>
                  <div className="mt-2">
                    <p className="font-medium text-foreground">Top Ingredients:</p>
                    <ul className="ml-4 list-disc">
                      {cat.topIngredients.slice(0, 3).map((ing: any, i: number) => (
                        <li key={i}>{ing.ingredient}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
