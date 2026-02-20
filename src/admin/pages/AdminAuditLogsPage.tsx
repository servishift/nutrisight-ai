import { ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MOCK_LOGS = [
  { id: '1', action: 'user.created', targetType: 'user', adminEmail: 'admin@foodintel.ai', details: 'Registered user sarah@example.com', createdAt: '2026-02-20T10:23:00Z' },
  { id: '2', action: 'additive.updated', targetType: 'additive', adminEmail: 'admin@foodintel.ai', details: 'Updated E102 risk level to high', createdAt: '2026-02-20T09:45:00Z' },
  { id: '3', action: 'user.deactivated', targetType: 'user', adminEmail: 'admin@foodintel.ai', details: 'Deactivated user alex@example.com', createdAt: '2026-02-19T16:12:00Z' },
  { id: '4', action: 'additive.created', targetType: 'additive', adminEmail: 'admin@foodintel.ai', details: 'Added new additive E635', createdAt: '2026-02-19T14:30:00Z' },
  { id: '5', action: 'setting.updated', targetType: 'setting', adminEmail: 'admin@foodintel.ai', details: 'Changed maintenance mode to off', createdAt: '2026-02-18T11:00:00Z' },
  { id: '6', action: 'user.deleted', targetType: 'user', adminEmail: 'admin@foodintel.ai', details: 'Deleted user spam@test.com', createdAt: '2026-02-18T08:20:00Z' },
];

const actionColor: Record<string, string> = {
  user: 'bg-info/10 text-info',
  additive: 'bg-primary/10 text-primary',
  setting: 'bg-warning/10 text-warning',
};

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track all admin actions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {MOCK_LOGS.map((log) => (
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
                    by {log.adminEmail} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
