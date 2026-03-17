import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import PageLayout from '@/components/layout/PageLayout';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import { Loader2, BarChart3, Network, TrendingUp, Users, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API = import.meta.env.VITE_API_BASE_URL || '';
const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16'];

function useFetch<T>(key: string, url: string) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () => {
      const res = await fetch(`${API}${url}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // cache 5 min client-side
  });
}

export default function AnalyticsPage() {
  const [section, setSection] = useState<'frequency' | 'graph'>('frequency');

  // ── Frequency queries ──────────────────────────────────────
  const { data: topData, isLoading: loadingTop } = useFetch<any>(
    'topIngredients', '/api/frequency/top-ingredients?limit=50'
  );
  const { data: catData, isLoading: loadingCat } = useFetch<any>(
    'categoryAnalysis', '/api/frequency/category-analysis'
  );

  // ── Graph queries ──────────────────────────────────────────
  const { data: stats, isLoading: loadingStats } = useFetch<any>('graphStats', '/api/graph/stats');
  const { data: hubs, isLoading: loadingHubs } = useFetch<any>('graphHubs', '/api/graph/hubs?limit=20');
  const { data: communities, isLoading: loadingComm } = useFetch<any>('graphCommunities', '/api/graph/communities?limit=8');
  const { data: additiveNet, isLoading: loadingAdditive } = useFetch<any>('additiveNetwork', '/api/graph/additive-network');

  const top20 = topData?.ingredients?.slice(0, 20) || [];
  const top10Cat = catData?.categories?.slice(0, 10) || [];

  const freqLoading = loadingTop || loadingCat;
  const graphLoading = loadingStats || loadingHubs || loadingComm || loadingAdditive;

  return (
    <PageLayout>
      <div className="container py-10">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">Ingredient frequency analysis &amp; co-occurrence network intelligence</p>
          </div>
          <DatabaseToggle />
        </div>

        {/* Section switcher */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => setSection('frequency')}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
              section === 'frequency'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Frequency Analysis
          </button>
          <button
            onClick={() => setSection('graph')}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
              section === 'graph'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Network className="h-4 w-4" /> Graph Intelligence
          </button>
        </div>

        {/* ══════════════ FREQUENCY SECTION ══════════════ */}
        {section === 'frequency' && (
          <div className="space-y-8">
            {freqLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Top 20 bar chart */}
                <div className="card-elevated p-6">
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

                {/* Top 50 table */}
                <div className="card-elevated p-6">
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
                        {topData?.ingredients?.map((item: any, idx: number) => (
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

                {/* Category analysis */}
                <div className="card-elevated p-6">
                  <h2 className="mb-4 font-display text-xl font-semibold">Category-wise Analysis</h2>
                  {top10Cat.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No category data available.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={top10Cat}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" angle={-45} textAnchor="end" height={120} fontSize={11} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="productCount" fill="#6366f1" name="Products" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {top10Cat.map((cat: any, idx: number) => (
                          <div key={idx} className="rounded-lg border border-border bg-muted/30 p-4">
                            <h3 className="mb-2 text-sm font-semibold">{cat.category}</h3>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>Products: {cat.productCount}</p>
                              <p>Avg Ingredients: {cat.avgIngredientsPerProduct}</p>
                              <div className="mt-2">
                                <p className="font-medium text-foreground">Top Ingredients:</p>
                                <ul className="ml-4 list-disc">
                                  {cat.topIngredients?.slice(0, 3).map((ing: any, i: number) => (
                                    <li key={i}>{ing.ingredient}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════ GRAPH SECTION ══════════════ */}
        {section === 'graph' && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Network, label: 'Ingredients', value: stats?.nodeCount ?? 0 },
                { icon: Zap, label: 'Connections', value: stats?.edgeCount ?? 0 },
                { icon: Users, label: 'Network Density', value: stats?.density?.toFixed(4) ?? 0 },
                { icon: TrendingUp, label: 'Avg Connections', value: stats?.avgDegree?.toFixed(1) ?? 0 },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="card-elevated p-6 flex items-center gap-3">
                  <Icon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{graphLoading ? '…' : value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {graphLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="hubs" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="hubs">Top Hubs</TabsTrigger>
                  <TabsTrigger value="analysis">Network Analysis</TabsTrigger>
                  <TabsTrigger value="communities">Communities</TabsTrigger>
                  <TabsTrigger value="additives">Additive Network</TabsTrigger>
                </TabsList>

                {/* Hubs */}
                <TabsContent value="hubs" className="space-y-6">
                  <div className="card-elevated p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">Top 20 Ingredient Hubs</h2>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={hubs?.hubs || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ingredient" angle={-45} textAnchor="end" height={120} fontSize={10} />
                        <YAxis /><Tooltip />
                        <Bar dataKey="connections" fill="#8b5cf6" name="Connections" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card-elevated p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">Centrality vs Frequency</h2>
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="frequency" name="Frequency" />
                        <YAxis dataKey="centrality" name="Centrality" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Ingredients" data={hubs?.hubs || []} fill="#8b5cf6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card-elevated p-6">
                    <h3 className="mb-4 font-semibold">Hub Statistics</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">Ingredient</th>
                            <th className="p-2 text-right">Connections</th>
                            <th className="p-2 text-right">Centrality</th>
                            <th className="p-2 text-right">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hubs?.hubs?.map((hub: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="p-2">{idx + 1}</td>
                              <td className="p-2 font-medium">{hub.ingredient}</td>
                              <td className="p-2 text-right">{hub.connections}</td>
                              <td className="p-2 text-right">{hub.centrality}</td>
                              <td className="p-2 text-right">{hub.frequency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Network Analysis */}
                <TabsContent value="analysis" className="space-y-6">
                  <div className="card-elevated p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">Connection Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={hubs?.hubs?.slice(0, 15) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ingredient" angle={-45} textAnchor="end" height={100} fontSize={10} />
                        <YAxis /><Tooltip />
                        <Line type="monotone" dataKey="connections" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="card-elevated p-6">
                      <h2 className="mb-4 font-display text-xl font-semibold">Top 8 Frequency Distribution</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={hubs?.hubs?.slice(0, 8) || []} dataKey="frequency" nameKey="ingredient" cx="50%" cy="50%" outerRadius={100} label={(e) => e.ingredient}>
                            {hubs?.hubs?.slice(0, 8).map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="card-elevated p-6">
                      <h2 className="mb-4 font-display text-xl font-semibold">Top 6 Radar</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={hubs?.hubs?.slice(0, 6).map((h: any) => ({ ingredient: h.ingredient.substring(0, 10), connections: h.connections, frequency: h.frequency / 10 })) || []}>
                          <PolarGrid /><PolarAngleAxis dataKey="ingredient" /><PolarRadiusAxis />
                          <Radar name="Connections" dataKey="connections" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                          <Radar name="Frequency" dataKey="frequency" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                {/* Communities */}
                <TabsContent value="communities">
                  <div className="card-elevated p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">Ingredient Communities</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {communities?.communities?.map((c: any, idx: number) => (
                        <div key={idx} className="rounded-lg border border-border bg-muted/30 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-semibold">Community {idx + 1}</h3>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{c.size} ingredients</span>
                          </div>
                          <div className="space-y-1">
                            {c.members.slice(0, 10).map((m: string, i: number) => (
                              <p key={i} className="truncate text-xs text-muted-foreground">• {m}</p>
                            ))}
                            {c.size > 10 && <p className="text-xs italic text-muted-foreground">+{c.size - 10} more...</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Additive Network */}
                <TabsContent value="additives" className="space-y-6">
                  <div className="card-elevated p-6">
                    <h2 className="mb-2 font-display text-xl font-semibold">Additive Co-occurrence Network</h2>
                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-2xl font-bold">{additiveNet?.stats?.totalAdditives ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Total Additives</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-2xl font-bold">{additiveNet?.stats?.connections ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Co-occurrences</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={additiveNet?.nodes?.slice(0, 10) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" /><YAxis dataKey="id" type="category" width={150} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="centrality" fill="#ef4444" name="Centrality" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card-elevated p-6">
                    <h2 className="mb-4 font-display text-xl font-semibold">Additive Frequency Distribution</h2>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={additiveNet?.nodes?.slice(0, 12) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="id" angle={-45} textAnchor="end" height={120} fontSize={10} />
                        <YAxis /><Tooltip />
                        <Bar dataKey="frequency" fill="#f59e0b" name="Frequency" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
