import { useQuery } from '@tanstack/react-query';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import PageLayout from '@/components/layout/PageLayout';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import { Loader2, Network, Users, Zap, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';
const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16'];

export default function GraphIntelligencePage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['graphStats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/graph/stats`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  const { data: hubs, isLoading: loadingHubs } = useQuery({
    queryKey: ['graphHubs'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/graph/hubs?limit=20`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  const { data: communities, isLoading: loadingCommunities } = useQuery({
    queryKey: ['graphCommunities'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/graph/communities?limit=8`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  const { data: additiveNetwork, isLoading: loadingAdditive } = useQuery({
    queryKey: ['additiveNetwork'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/graph/additive-network`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  if (loadingStats || loadingHubs || loadingCommunities || loadingAdditive) {
    return (
      <PageLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-10">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2 font-display text-3xl font-bold">Graph Intelligence</h1>
              <p className="text-muted-foreground">Ingredient co-occurrence network analysis</p>
            </div>
            <DatabaseToggle />
          </div>
        </div>

        {/* Network Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.nodeCount || 0}</p>
                <p className="text-sm text-muted-foreground">Ingredients</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.edgeCount || 0}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.density?.toFixed(4) || 0}</p>
                <p className="text-sm text-muted-foreground">Network Density</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.avgDegree?.toFixed(1) || 0}</p>
                <p className="text-sm text-muted-foreground">Avg Connections</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="hubs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hubs">Top Hubs</TabsTrigger>
            <TabsTrigger value="analysis">Network Analysis</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="additives">Additive Network</TabsTrigger>
          </TabsList>

          <TabsContent value="hubs">
            <div className="space-y-6">
              <div className="card-elevated p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Top 20 Ingredient Hubs</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Ingredients with highest connectivity (most co-occurrences)
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={hubs?.hubs || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ingredient" angle={-45} textAnchor="end" height={120} fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="connections" fill="#8b5cf6" name="Connections" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Centrality vs Frequency Scatter */}
              <div className="card-elevated p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Centrality vs Frequency Analysis</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Relationship between ingredient connectivity and usage frequency
                </p>
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
                <h3 className="mb-4 font-semibold">Detailed Hub Statistics</h3>
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
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-6">
              {/* Top 10 Connections Line Chart */}
              <div className="card-elevated p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Connection Distribution</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  How connections decrease across top ingredients
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hubs?.hubs?.slice(0, 15) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ingredient" angle={-45} textAnchor="end" height={100} fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="connections" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Frequency Distribution Pie */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card-elevated p-6">
                  <h2 className="mb-4 font-display text-xl font-semibold">Top 8 Frequency Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={hubs?.hubs?.slice(0, 8) || []}
                        dataKey="frequency"
                        nameKey="ingredient"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => entry.ingredient}
                      >
                        {hubs?.hubs?.slice(0, 8).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Chart */}
                <div className="card-elevated p-6">
                  <h2 className="mb-4 font-display text-xl font-semibold">Top 6 Ingredients Radar</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={hubs?.hubs?.slice(0, 6).map((h: any) => ({
                      ingredient: h.ingredient.substring(0, 10),
                      connections: h.connections,
                      frequency: h.frequency / 10
                    })) || []}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="ingredient" />
                      <PolarRadiusAxis />
                      <Radar name="Connections" dataKey="connections" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Radar name="Frequency" dataKey="frequency" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Network Metrics */}
              <div className="card-elevated p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Network Metrics Comparison</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { metric: 'Nodes', value: stats?.nodeCount || 0 },
                    { metric: 'Edges', value: (stats?.edgeCount || 0) / 10 },
                    { metric: 'Density x1000', value: (stats?.density || 0) * 1000 },
                    { metric: 'Avg Degree', value: stats?.avgDegree || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communities">
            <div className="card-elevated p-6">
              <h2 className="mb-4 font-display text-xl font-semibold">Ingredient Communities</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Clusters of ingredients that frequently appear together
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {communities?.communities?.map((community: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold">Community {idx + 1}</h3>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {community.size} ingredients
                      </span>
                    </div>
                    <div className="space-y-1">
                      {community.members.slice(0, 10).map((member: string, i: number) => (
                        <p key={i} className="truncate text-xs text-muted-foreground">
                          • {member}
                        </p>
                      ))}
                      {community.size > 10 && (
                        <p className="text-xs italic text-muted-foreground">
                          +{community.size - 10} more...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="additives">
            <div className="space-y-6">
              <div className="card-elevated p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Additive Co-occurrence Network</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  How additives appear together in products
                </p>
                
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-2xl font-bold">{additiveNetwork?.stats?.totalAdditives || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Additives</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-2xl font-bold">{additiveNetwork?.stats?.connections || 0}</p>
                    <p className="text-sm text-muted-foreground">Co-occurrences</p>
                  </div>
                </div>
              </div>

              {/* Additive Centrality Chart */}
              <div className="card-elevated p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Additive Network Centrality</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={additiveNetwork?.nodes?.slice(0, 10) || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="id" type="category" width={150} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="centrality" fill="#ef4444" name="Centrality" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Additive Frequency */}
              <div className="card-elevated p-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Additive Frequency Distribution</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={additiveNetwork?.nodes?.slice(0, 12) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="id" angle={-45} textAnchor="end" height={120} fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#f59e0b" name="Frequency" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card-elevated p-6">
                <h3 className="mb-4 font-semibold">Top Connected Additives:</h3>
                <div className="space-y-3">
                  {additiveNetwork?.nodes?.map((node: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                      <div>
                        <p className="font-medium text-sm">{node.id}</p>
                        <p className="text-xs text-muted-foreground">Frequency: {node.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{node.centrality}</p>
                        <p className="text-xs text-muted-foreground">Centrality</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
