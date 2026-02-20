import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

const RANGES = ['7d', '30d', '90d', '1y'] as const;

const GROWTH = [
  { date: 'Mon', users: 42, analyses: 320, revenue: 120 },
  { date: 'Tue', users: 38, analyses: 410, revenue: 95 },
  { date: 'Wed', users: 55, analyses: 380, revenue: 150 },
  { date: 'Thu', users: 61, analyses: 520, revenue: 180 },
  { date: 'Fri', users: 48, analyses: 480, revenue: 140 },
  { date: 'Sat', users: 30, analyses: 260, revenue: 80 },
  { date: 'Sun', users: 25, analyses: 210, revenue: 60 },
];

const PLANS = [
  { name: 'Free', value: 2200, color: 'hsl(var(--muted-foreground))' },
  { name: 'Pro', value: 480, color: 'hsl(var(--primary))' },
  { name: 'Enterprise', value: 67, color: 'hsl(var(--accent))' },
];

const RETENTION = [
  { week: 'W1', rate: 100 },
  { week: 'W2', rate: 72 },
  { week: 'W3', rate: 58 },
  { week: 'W4', rate: 51 },
  { week: 'W5', rate: 48 },
  { week: 'W6', rate: 45 },
  { week: 'W7', rate: 44 },
  { week: 'W8', rate: 43 },
];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<typeof RANGES[number]>('7d');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform performance metrics</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {RANGES.map((r) => (
            <Button key={r} variant={range === r ? 'default' : 'ghost'} size="sm" className="text-xs" onClick={() => setRange(r)}>
              {r}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signups & Analyses */}
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Signups & Analyses</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH}>
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
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#gu)" strokeWidth={2} />
                  <Area type="monotone" dataKey="analyses" stroke="hsl(var(--accent))" fill="url(#ga)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">User Plan Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PLANS} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {PLANS.map((p) => (
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

        {/* Revenue */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH}>
                  <defs>
                    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fill="url(#gr)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Retention */}
        <Card>
          <CardHeader><CardTitle className="text-base">User Retention</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RETENTION}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, 'Retention']} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
