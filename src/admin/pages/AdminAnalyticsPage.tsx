import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';
import { Activity, TrendingUp, Zap, AlertTriangle, Clock, Download, Users, Target, DollarSign } from 'lucide-react';
import { getAnalytics, getUsers, getModelPerformance, getTopAdditives, getAdvancedAnalytics, exportAnalyticsReport } from '../services/admin-api';
import { getUsageAnalytics } from '@/services/phase4-api';
import { toast } from 'sonner';
import type { AnalyticsData } from '../types/admin';

const RANGES = ['7d', '30d', '90d', '1y'] as const;

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<typeof RANGES[number]>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [planData, setPlanData] = useState<any[]>([]);
  const [modelPerf, setModelPerf] = useState<any>(null);
  const [topAdditives, setTopAdditives] = useState<any[]>([]);
  const [apiUsage, setApiUsage] = useState<any>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Refresh API usage every 30 seconds
    const interval = setInterval(loadApiUsage, 30000);
    return () => clearInterval(interval);
  }, [range]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, usersData, modelData, additivesData, advData] = await Promise.all([
        getAnalytics(range),
        getUsers(),
        getModelPerformance(),
        getTopAdditives(),
        getAdvancedAnalytics().catch(() => null)
      ]);
      
      const formatted = analyticsData.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));
      setAnalytics(formatted);
      
      const roleCounts = usersData.users.reduce((acc: any, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {});
      
      setPlanData([
        { name: 'User', value: roleCounts.user || 0, color: 'hsl(var(--muted-foreground))' },
        { name: 'Admin', value: roleCounts.admin || 0, color: 'hsl(var(--primary))' },
        { name: 'SuperAdmin', value: roleCounts.superadmin || 0, color: 'hsl(var(--accent))' },
      ]);

      setModelPerf(modelData);
      setTopAdditives(additivesData);
      setAdvancedAnalytics(advData);
      
      await loadApiUsage();
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiUsage = async () => {
    try {
      const usage = await getUsageAnalytics(24);
      setApiUsage(usage);
    } catch (error) {
      console.error('Failed to load API usage:', error);
    }
  };

  const handleExport = async () => {
    try {
      if (!advancedAnalytics) return;
      const csv = [
        ['Metric', 'Value'],
        ['Total Users', advancedAnalytics.trafficStats.totalUsers],
        ['Active Users (30d)', advancedAnalytics.trafficStats.activeUsers30d],
        ['Total Analyses', advancedAnalytics.engagementStats.totalAnalyses],
        ['Retention Rate', advancedAnalytics.engagementStats.retentionRate + '%'],
        ['Conversion Rate', advancedAnalytics.conversionStats.conversionRate + '%'],
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  const modelMetrics = modelPerf ? [
    { metric: 'Accuracy', value: modelPerf.accuracy * 100 },
    { metric: 'Precision', value: modelPerf.precision * 100 },
    { metric: 'Recall', value: modelPerf.recall * 100 },
    { metric: 'F1 Score', value: modelPerf.f1Score * 100 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Platform performance metrics and business intelligence</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {RANGES.map((r) => (
              <Button key={r} variant={range === r ? 'default' : 'ghost'} size="sm" className="text-xs" onClick={() => setRange(r)}>
                {r}
              </Button>
            ))}
          </div>
          {advancedAnalytics && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
          <TabsTrigger value="ml">ML Performance</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">{range}</span>
              </div>
              <div className="text-2xl font-bold">{analytics.reduce((sum, d) => sum + d.users, 0)}</div>
              <p className="text-xs text-muted-foreground">New Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-accent" />
                <span className="text-xs text-muted-foreground">{range}</span>
              </div>
              <div className="text-2xl font-bold">{analytics.reduce((sum, d) => sum + d.analyses, 0)}</div>
              <p className="text-xs text-muted-foreground">Total Analyses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-xs text-muted-foreground">Avg/Day</span>
              </div>
              <div className="text-2xl font-bold">{Math.round(analytics.reduce((sum, d) => sum + d.analyses, 0) / (analytics.length || 1))}</div>
              <p className="text-xs text-muted-foreground">Analyses per Day</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-info" />
                <span className="text-xs text-muted-foreground">Roles</span>
              </div>
              <div className="text-2xl font-bold">{planData.reduce((sum, p) => sum + p.value, 0)}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Growth Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Signups & Analyses</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics}>
                    <defs>
                      <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#gu)" strokeWidth={2} name="Users" />
                    <Area type="monotone" dataKey="analyses" stroke="hsl(var(--accent))" fill="url(#ga)" strokeWidth={2} name="Analyses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">User Role Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {planData.map((p) => (
                        <Cell key={p.name} fill={p.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" iconType="circle" formatter={(v: string) => <span className="text-xs text-foreground">{v}</span>} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Detected Additives</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAdditives} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="code" type="category" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
        <div>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Real-time API Usage</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { icon: TrendingUp, label: 'Total Requests', value: apiUsage?.total_requests || 0, color: 'text-primary bg-primary/10' },
            { icon: Zap, label: 'Avg Latency', value: `${apiUsage?.avg_latency || 0}ms`, color: 'text-accent bg-accent/10' },
            { icon: AlertTriangle, label: 'Error Rate', value: `${apiUsage?.error_rate || 0}%`, color: 'text-destructive bg-destructive/10' },
            { icon: Clock, label: 'Uptime', value: `${apiUsage?.uptime || 100}%`, color: 'text-success bg-success/10' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Requests by Hour</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apiUsage?.requests_by_hour || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Latency Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={apiUsage?.latency_by_hour || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="latency" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Top Endpoints</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(apiUsage?.top_endpoints || []).map((e: any, i: number) => (
              <div key={e.endpoint} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: `hsl(${i * 60} 60% 50%)` }} />
                  <code className="truncate text-xs">{e.endpoint}</code>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold text-foreground">{e.count.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{e.avgLatency}ms</span>
                </div>
              </div>
            ))}
            {(!apiUsage || apiUsage.top_endpoints?.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No API calls yet</p>
            )}
          </CardContent>
        </Card>
        </div>
        </TabsContent>

        <TabsContent value="ml" className="space-y-6">
        {modelPerf ? (
          <>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-foreground">{modelPerf?.totalPredictions || 0}</div>
              <p className="text-xs text-muted-foreground">Total Predictions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-success">{((modelPerf?.accuracy || 0) * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{((modelPerf?.precision || 0) * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Precision</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-accent">{((modelPerf?.recall || 0) * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Recall</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ML Model Performance</CardTitle>
            <p className="text-xs text-muted-foreground">Category Prediction Model v{modelPerf?.modelVersion || '1.0.0'}</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={modelMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Performance" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{modelPerf?.totalPredictions || 0}</p>
                <p className="text-xs text-muted-foreground">Total Predictions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{((modelPerf?.accuracy || 0) * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Model Version</span>
              <span className="text-sm font-semibold">{modelPerf?.modelVersion || '1.0.0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">F1 Score</span>
              <span className="text-sm font-semibold">{((modelPerf?.f1Score || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Precision</span>
              <span className="text-sm font-semibold">{((modelPerf?.precision || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recall</span>
              <span className="text-sm font-semibold">{((modelPerf?.recall || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Trained</span>
              <span className="text-sm font-semibold">{modelPerf?.lastTrained ? new Date(modelPerf.lastTrained).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Categories</span>
              <span className="text-sm font-semibold">{modelPerf?.categoryDistribution?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
        </div>

        {modelPerf?.categoryDistribution && modelPerf.categoryDistribution.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Category Prediction Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelPerf.categoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No ML Data Available</h3>
              <p className="text-sm text-muted-foreground">ML model performance metrics will appear here once predictions are made</p>
            </CardContent>
          </Card>
        )}
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
        {advancedAnalytics && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{advancedAnalytics.trafficStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{advancedAnalytics.trafficStats.activeUsers30d}</div>
                  <p className="text-xs text-muted-foreground">Active Users (30d)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{advancedAnalytics.engagementStats.retentionRate}%</div>
                  <p className="text-xs text-muted-foreground">Retention Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{advancedAnalytics.conversionStats.conversionRate}%</div>
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Category Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={advancedAnalytics.categoryPerformance.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Popular Ingredients</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={advancedAnalytics.popularIngredients.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="ingredient" type="category" tick={{ fontSize: 11 }} width={80} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
