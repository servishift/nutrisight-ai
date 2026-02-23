import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  Activity, TrendingUp, Zap, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// Demo data
const DAILY_USAGE = Array.from({ length: 30 }, (_, i) => ({
  date: `Feb ${i + 1}`,
  requests: Math.floor(200 + Math.random() * 800),
  errors: Math.floor(Math.random() * 30),
}));

const ENDPOINT_BREAKDOWN = [
  { endpoint: '/api/analyze', count: 5420, avgLatency: 85, color: 'hsl(152 50% 45%)' },
  { endpoint: '/api/similar-products', count: 3215, avgLatency: 142, color: 'hsl(38 85% 55%)' },
  { endpoint: '/api/predict-brand', count: 1870, avgLatency: 128, color: 'hsl(200 80% 50%)' },
  { endpoint: '/api/detect-reformulation', count: 980, avgLatency: 95, color: 'hsl(340 65% 55%)' },
  { endpoint: '/api/detect-allergens', count: 762, avgLatency: 32, color: 'hsl(270 50% 55%)' },
];

const LATENCY_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  p50: 40 + Math.random() * 30,
  p95: 100 + Math.random() * 80,
  p99: 200 + Math.random() * 150,
}));

export default function ApiUsagePage() {
  const [period, setPeriod] = useState('30d');

  const totalRequests = DAILY_USAGE.reduce((s, d) => s + d.requests, 0);
  const totalErrors = DAILY_USAGE.reduce((s, d) => s + d.errors, 0);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);
  const avgLatency = Math.round(ENDPOINT_BREAKDOWN.reduce((s, e) => s + e.avgLatency * e.count, 0) / ENDPOINT_BREAKDOWN.reduce((s, e) => s + e.count, 0));

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">Phase 4</Badge>
              <Badge variant="outline" className="border-accent/30 text-accent">Analytics</Badge>
            </div>
            <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
              <Activity className="mr-2 inline h-8 w-8 text-primary" />
              API Usage
            </h1>
            <p className="text-muted-foreground">Monitor your API performance and usage</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: TrendingUp, label: 'Total Requests', value: totalRequests.toLocaleString(), change: '+12.4%', up: true, color: 'text-primary bg-primary/10' },
            { icon: Zap, label: 'Avg Latency', value: `${avgLatency}ms`, change: '-8.2%', up: false, color: 'text-accent bg-accent/10' },
            { icon: AlertTriangle, label: 'Error Rate', value: `${errorRate}%`, change: '-2.1%', up: false, color: 'text-destructive bg-destructive/10' },
            { icon: Clock, label: 'Uptime', value: '99.97%', change: '+0.02%', up: true, color: 'text-success bg-success/10' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${s.up ? 'text-success' : 'text-destructive'}`}>
                    {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {s.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Daily Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DAILY_USAGE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="hsl(152 50% 45%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="errors" fill="hsl(0 72% 51%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Latency (ms)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={LATENCY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="p50" stroke="hsl(152 50% 45%)" strokeWidth={2} dot={false} name="p50" />
                    <Line type="monotone" dataKey="p95" stroke="hsl(38 85% 55%)" strokeWidth={2} dot={false} name="p95" />
                    <Line type="monotone" dataKey="p99" stroke="hsl(0 72% 51%)" strokeWidth={1.5} dot={false} name="p99" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Endpoint Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ENDPOINT_BREAKDOWN} dataKey="count" nameKey="endpoint" cx="50%" cy="50%" outerRadius={90} label={({ endpoint, percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {ENDPOINT_BREAKDOWN.map((e) => (
                        <Cell key={e.endpoint} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Top Endpoints</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ENDPOINT_BREAKDOWN.map((e) => (
                <div key={e.endpoint} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: e.color }} />
                    <code className="truncate text-xs">{e.endpoint}</code>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-semibold text-foreground">{e.count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{e.avgLatency}ms</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
