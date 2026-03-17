import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, Users, Activity, DollarSign, Target } from 'lucide-react';
import { getAdvancedAnalytics, exportAnalyticsReport } from '../services/admin-api';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAdvancedAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const data = await exportAnalyticsReport(format);
      
      if (format === 'csv') {
        const csv = [
          ['Metric', 'Value'],
          ['Total Users', analytics.trafficStats.totalUsers],
          ['Active Users (30d)', analytics.trafficStats.activeUsers30d],
          ['Active Users (7d)', analytics.trafficStats.activeUsers7d],
          ['Total Analyses', analytics.engagementStats.totalAnalyses],
          ['Retention Rate', analytics.engagementStats.retentionRate + '%'],
          ['Conversion Rate', analytics.conversionStats.conversionRate + '%'],
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center text-muted-foreground">No data available</div>;
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">Business intelligence and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.trafficStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.trafficStats.newUsers30d} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.trafficStats.activeUsers30d}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementStats.retentionRate}%</div>
            <p className="text-xs text-muted-foreground">
              30-day retention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Free to paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryPerformance.slice(0, 10)}>
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
          <CardHeader>
            <CardTitle className="text-base">User Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Users (7 days)</span>
                <span className="text-2xl font-bold">{analytics.growthMetrics.userGrowth7d}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Users (30 days)</span>
                <span className="text-2xl font-bold">{analytics.growthMetrics.userGrowth30d}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Analyses (7 days)</span>
                <span className="text-2xl font-bold">{analytics.growthMetrics.analysisGrowth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Analyses per User</span>
                <span className="text-2xl font-bold">{analytics.engagementStats.avgAnalysesPerUser.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 20 Popular Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.popularIngredients} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="ingredient" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Users:</span>
              <span className="font-semibold">{analytics.trafficStats.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active (30d):</span>
              <span className="font-semibold">{analytics.trafficStats.activeUsers30d}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active (7d):</span>
              <span className="font-semibold">{analytics.trafficStats.activeUsers7d}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New (30d):</span>
              <span className="font-semibold">{analytics.trafficStats.newUsers30d}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Analyses:</span>
              <span className="font-semibold">{analytics.engagementStats.totalAnalyses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg per User:</span>
              <span className="font-semibold">{analytics.engagementStats.avgAnalysesPerUser.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retention Rate:</span>
              <span className="font-semibold">{analytics.engagementStats.retentionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid Users:</span>
              <span className="font-semibold">{analytics.conversionStats.paidUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion Rate:</span>
              <span className="font-semibold">{analytics.conversionStats.conversionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
