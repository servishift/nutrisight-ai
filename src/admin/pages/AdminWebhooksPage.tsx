import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Webhook, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { request } from '../services/admin-api';
import { useToast } from '@/hooks/use-toast';

export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, success: 0, failed: 0, rate: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await request<any>('/api/admin/webhooks');
      setWebhooks(data.webhooks || []);
      const active = data.webhooks?.filter((w: any) => w.status === 'active').length || 0;
      const totalSuccess = data.webhooks?.reduce((sum: number, w: any) => sum + (w.successCount || 0), 0) || 0;
      const totalFailed = data.webhooks?.reduce((sum: number, w: any) => sum + (w.failureCount || 0), 0) || 0;
      const rate = totalSuccess + totalFailed > 0 ? (totalSuccess / (totalSuccess + totalFailed) * 100).toFixed(1) : 0;
      setStats({ active, success: totalSuccess, failed: totalFailed, rate });
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      toast({ title: 'Error', description: 'Failed to load webhooks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      await request(`/api/admin/webhooks/${webhookId}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Webhook deleted' });
      loadWebhooks();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete webhook', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Webhook className="w-8 h-8" />
            Webhook Management
          </h1>
          <p className="text-gray-600 mt-1">Monitor all user webhook endpoints</p>
          <p className="text-sm text-amber-600 mt-1">ℹ️ Webhooks are created by users. Admin can only view and manage.</p>
        </div>
        <Button className="gap-2" disabled title="Users create webhooks from their dashboard">
          <Plus className="w-4 h-4" />
          Add Webhook (User Only)
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Webhooks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            <div className="text-sm text-gray-600">Successful Deliveries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed Deliveries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.rate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-2">No webhooks configured yet</p>
              <p className="text-sm text-gray-400">Users can create webhooks from their dashboard at /webhooks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{webhook.url}</code>
                      <Badge variant={webhook.status === 'active' ? 'default' : 'destructive'}>
                        {webhook.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Events: <strong>{webhook.events?.join(', ')}</strong></span>
                      <span>Success: {webhook.successCount || 0}</span>
                      <span>Failed: {webhook.failureCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadWebhooks}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteWebhook(webhook.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Webhook Form - Hidden for now */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle>Add New Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Webhook URL</label>
            <Input placeholder="https://your-domain.com/webhook" />
          </div>
          <div>
            <label className="text-sm font-medium">Event Type</label>
            <select className="w-full border rounded-md p-2">
              <option>user.created</option>
              <option>user.updated</option>
              <option>analysis.completed</option>
              <option>payment.success</option>
              <option>payment.failed</option>
            </select>
          </div>
          <Button>Create Webhook</Button>
        </CardContent>
      </Card>
    </div>
  );
}
