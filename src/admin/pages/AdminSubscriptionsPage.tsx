import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Users, DollarSign, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  status: string;
  type: 'platform' | 'api';
  usedAnalyses: number;
  usedApiRequests: number;
  limits: {
    analyses_per_month: number;
    api_requests_per_month: number;
  };
  startDate: string;
  endDate: string;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  byPlan: {
    free: number;
    pro: number;
    enterprise: number;
    api_free: number;
    api_starter: number;
    api_professional: number;
  };
  monthlyRecurring: number;
  totalRevenue: number;
  platform: {
    total: number;
    active: number;
    revenue: number;
  };
  api: {
    total: number;
    active: number;
    revenue: number;
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { request } = await import('../services/admin-api');
      const [uniData, statsData] = await Promise.all([
        request<any>('/api/admin/subscriptions/unified'),
        request<any>('/api/admin/subscriptions/unified-stats').catch(() => null),
      ]);
      const subs = uniData.subscriptions || [];
      setSubscriptions(subs);
      const s = statsData || {};
      setStats({
        total: s.total ?? subs.length,
        active: s.active ?? subs.filter((x: any) => x.status === 'active').length,
        expired: s.expired ?? 0,
        cancelled: s.cancelled ?? subs.filter((x: any) => x.status === 'cancelled').length,
        byPlan: s.byPlan ?? {
          free: subs.filter((x: any) => x.planId === 'free' && x.type === 'platform').length,
          pro: subs.filter((x: any) => x.planId === 'pro').length,
          enterprise: subs.filter((x: any) => x.planId === 'enterprise').length,
          api_free: subs.filter((x: any) => x.planId === 'free' && x.type === 'api').length,
          api_starter: subs.filter((x: any) => x.planId === 'starter').length,
          api_professional: subs.filter((x: any) => x.planId === 'professional').length,
        },
        monthlyRecurring: s.monthlyRecurring ?? 0,
        totalRevenue: s.totalRevenue ?? 0,
        platform: { total: s.platform?.total ?? subs.filter((x: any) => x.type === 'platform').length, active: s.platform?.active ?? 0, revenue: s.platform?.revenue ?? 0 },
        api: { total: s.api?.total ?? subs.filter((x: any) => x.type === 'api').length, active: s.api?.active ?? 0, revenue: s.api?.revenue ?? 0 },
      });
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (id: string, type: 'platform' | 'api') => {
    if (!confirm('Cancel this subscription?')) return;
    try {
      const { request } = await import('../services/admin-api');
      const collection = type === 'platform' ? 'platform' : 'api';
      await request(`/api/admin/subscriptions/${collection}/${id}/cancel`, { method: 'POST' });
      loadData();
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  const handleDeleteSubscription = async (id: string, type: 'platform' | 'api') => {
    if (!confirm('Permanently DELETE this subscription? This cannot be undone.')) return;
    try {
      const { request } = await import('../services/admin-api');
      await request(`/api/admin/subscriptions/${type}/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                         sub.userName.toLowerCase().includes(search.toLowerCase());
    
    let matchesPlan = false;
    if (filterPlan === 'all') {
      matchesPlan = true;
    } else if (filterPlan.startsWith('api_')) {
      const apiPlan = filterPlan.replace('api_', '');
      matchesPlan = sub.type === 'api' && sub.planId === apiPlan;
    } else {
      matchesPlan = sub.type === 'platform' && sub.planId === filterPlan;
    }
    
    return matchesSearch && matchesPlan;
  });

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Manage user subscriptions and billing</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.byPlan?.pro || 0) + (stats.byPlan?.api_starter || 0) + (stats.byPlan?.api_professional || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Platform: {stats.byPlan?.pro || 0} | API: {(stats.byPlan?.api_starter || 0) + (stats.byPlan?.api_professional || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.monthlyRecurring || 0}</div>
              <p className="text-xs text-muted-foreground">
                Platform: ₹{stats.platform?.revenue || 0} | API: ₹{stats.api?.revenue || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Free Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byPlan?.free || 0}</div>
              <p className="text-xs text-muted-foreground">
                Potential upgrades
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterPlan === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPlan('all')}
              >
                All
              </Button>
              <Button
                variant={filterPlan === 'free' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPlan('free')}
              >
                Free
              </Button>
              <Button
                variant={filterPlan === 'pro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPlan('pro')}
              >
                Pro
              </Button>
              <Button
                variant={filterPlan === 'api_starter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPlan('api_starter')}
              >
                API Starter
              </Button>
              <Button
                variant={filterPlan === 'api_professional' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPlan('api_professional')}
              >
                API Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({filteredSubscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.userName}</div>
                      <div className="text-sm text-muted-foreground">{sub.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.type === 'platform' ? 'default' : 'outline'}>
                      {sub.type === 'platform' ? 'Platform' : 'API'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.planId === 'pro' || sub.planId === 'professional' ? 'default' : 'secondary'}>
                      {sub.planName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {sub.type === 'platform' ? (
                        <>
                          <div>Analyses: {sub.usedAnalyses ?? 0}/{sub.limits?.analyses_per_month ?? 0}</div>
                          <div>API: {sub.usedApiRequests ?? 0}/{sub.limits?.api_requests_per_month ?? 0}</div>
                        </>
                      ) : (
                        <div>Requests: {(sub as any).requestsUsed ?? 0}/{(sub as any).requestsLimit ?? 0}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Forever'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {sub.status === 'active' && sub.planId !== 'free' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelSubscription(sub.id, sub.type)}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSubscription(sub.id, sub.type)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
