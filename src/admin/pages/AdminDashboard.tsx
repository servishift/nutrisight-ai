import { Users, BarChart3, TrendingUp, DollarSign, Activity, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data for UI development — replaced by admin-api calls when backend is ready
const STATS = [
  { label: 'Total Users', value: '2,847', change: '+12.5%', icon: Users, trend: 'up' as const },
  { label: 'Active Users', value: '1,234', change: '+8.2%', icon: Activity, trend: 'up' as const },
  { label: 'Analyses Today', value: '5,621', change: '+23.1%', icon: BarChart3, trend: 'up' as const },
  { label: 'Pro Subscribers', value: '182', change: '+4.7%', icon: DollarSign, trend: 'up' as const },
];

const CHART_DATA = [
  { date: 'Jan', users: 400, analyses: 2400 },
  { date: 'Feb', users: 600, analyses: 3200 },
  { date: 'Mar', users: 900, analyses: 4100 },
  { date: 'Apr', users: 1200, analyses: 5300 },
  { date: 'May', users: 1800, analyses: 6800 },
  { date: 'Jun', users: 2400, analyses: 8200 },
  { date: 'Jul', users: 2847, analyses: 9500 },
];

const TOP_ADDITIVES = [
  { name: 'E621 (MSG)', count: 1842 },
  { name: 'E330 (Citric Acid)', count: 1567 },
  { name: 'E102 (Tartrazine)', count: 1203 },
  { name: 'E211 (Sodium Benzoate)', count: 987 },
  { name: 'E150d (Caramel Color)', count: 876 },
];

const RECENT_USERS = [
  { name: 'Sarah Chen', email: 'sarah@example.com', plan: 'Pro', date: '2 min ago' },
  { name: 'Mike Johnson', email: 'mike@example.com', plan: 'Free', date: '15 min ago' },
  { name: 'Emily Davis', email: 'emily@example.com', plan: 'Enterprise', date: '1h ago' },
  { name: 'Alex Kim', email: 'alex@example.com', plan: 'Free', date: '3h ago' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of FoodIntel AI platform</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="mt-2 flex items-center text-xs font-medium text-success">
                <TrendingUp className="mr-1 h-3 w-3" />
                {s.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">User & Analysis Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillAnalyses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#fillUsers)" strokeWidth={2} />
                  <Area type="monotone" dataKey="analyses" stroke="hsl(var(--accent))" fill="url(#fillAnalyses)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Top Detected Additives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TOP_ADDITIVES} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {RECENT_USERS.map((u) => (
              <div key={u.email} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.plan === 'Pro' ? 'bg-primary/10 text-primary' :
                    u.plan === 'Enterprise' ? 'bg-accent/10 text-accent' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {u.plan}
                  </span>
                  <span className="text-xs text-muted-foreground">{u.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
