import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAuditLogs } from '../services/admin-api';
import type { AuditLog } from '../types/admin';

const actionColor: Record<string, string> = {
  user: 'bg-info/10 text-info',
  additive: 'bg-primary/10 text-primary',
  setting: 'bg-warning/10 text-warning',
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getAuditLogs();
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track all admin actions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No audit logs yet. Admin actions will appear here.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ScrollText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-medium text-foreground">{log.action}</code>
                      <Badge variant="secondary" className={`text-xs capitalize ${actionColor[log.targetType] || ''}`}>
                        {log.targetType}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{log.details}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {log.adminEmail} · {log.createdAt ? new Date(log.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Unknown date'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
