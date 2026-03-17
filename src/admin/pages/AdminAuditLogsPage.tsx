import { useState, useEffect } from 'react';
import { ScrollText, Search, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getAuditLogs } from '../services/admin-api';
import type { AuditLog } from '../types/admin';

const typeColor: Record<string, string> = {
  user: 'bg-info/10 text-info',
  additive: 'bg-primary/10 text-primary',
  setting: 'bg-warning/10 text-warning',
  email_template: 'bg-accent/10 text-accent',
  email_campaign: 'bg-success/10 text-success',
  coupon: 'bg-destructive/10 text-destructive',
  automation_rule: 'bg-purple-500/10 text-purple-500',
  api_key: 'bg-orange-500/10 text-orange-500',
  content_page: 'bg-teal-500/10 text-teal-500',
  webhook: 'bg-pink-500/10 text-pink-500',
};

function formatDate(raw: string | null | undefined): string {
  if (!raw) return 'Unknown date';
  // Handle both "2026-03-17T09:39:15.293431Z" and "2026-03-17T09:39:15+00:00" etc.
  const cleaned = raw.replace(/\+00:00Z$/, 'Z').replace(/\+00:00$/, 'Z');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(page);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      log.adminEmail?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || log.targetType === filterType;
    return matchSearch && matchType;
  });

  const types = ['all', 'user', 'setting', 'additive', 'email_template', 'email_campaign', 'coupon', 'automation_rule', 'api_key'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Track all admin actions ({total} total)</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search action, details, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {types.map(t => (
            <Button
              key={t}
              variant={filterType === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(t)}
              className="capitalize text-xs"
            >
              {t === 'all' ? 'All' : t.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {search || filterType !== 'all' ? ' (filtered)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No audit logs found.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(log => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ScrollText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-medium text-foreground">{log.action}</code>
                      <Badge variant="secondary" className={`text-xs capitalize ${typeColor[log.targetType] || ''}`}>
                        {log.targetType?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{log.details}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {log.adminEmail} · {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
