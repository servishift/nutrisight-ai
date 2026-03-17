import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Webhook, Plus, Trash2, CheckCircle2, XCircle, ExternalLink, RefreshCw, Info, Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createWebhook, listWebhooks, deleteWebhook } from '@/services/phase4-api';
import type { WebhookConfig } from '@/types/phase4';

const EVENTS = [
  'analysis.completed',
  'batch.completed',
  'similarity.completed',
  'brand.predicted',
  'reformulation.detected',
  'subscription.created',
  'subscription.cancelled',
];

const DEMO_WEBHOOKS: WebhookConfig[] = [];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await listWebhooks();
      setWebhooks(data.webhooks || []);
      setDemoMode(false);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCreate = async () => {
    if (!newUrl.trim() || selectedEvents.length === 0) return;
    setLoading(true);
    try {
      await createWebhook(newUrl, selectedEvents);
      await loadWebhooks();
      setCreateOpen(false);
      setNewUrl('');
      setSelectedEvents([]);
      toast({ title: 'Webhook created successfully' });
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast({ 
        title: 'Failed to create webhook', 
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWebhook(id);
      await loadWebhooks();
      toast({ title: 'Webhook deleted successfully' });
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast({ 
        title: 'Failed to delete webhook',
        variant: 'destructive'
      });
    }
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">Phase 4</Badge>
              <Badge variant="outline" className="border-accent/30 text-accent">Integrations</Badge>
            </div>
            <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
              <Webhook className="mr-2 inline h-8 w-8 text-accent" />
              Webhooks
            </h1>
            <p className="text-muted-foreground">Configure event-driven callbacks for your integrations</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Webhook</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>Add a URL to receive event notifications.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Endpoint URL</label>
                  <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://yourapp.com/webhooks/foodintel" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Events</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENTS.map((ev) => (
                      <Badge
                        key={ev}
                        variant={selectedEvents.includes(ev) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleEvent(ev)}
                      >
                        {ev}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newUrl.trim() || selectedEvents.length === 0 || loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {demoMode && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs text-muted-foreground">
              Demo mode — Connect backend for real webhook management.
            </p>
          </div>
        )}

        {loading && !webhooks.length ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No webhooks configured yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((wh) => (
              <motion.div key={wh.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {wh.isActive ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <code className="truncate text-sm font-medium text-foreground">{wh.url}</code>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {wh.events.map((ev) => (
                            <Badge key={ev} variant="secondary" className="text-[10px]">{ev}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Secret: <code>{wh.secret}</code></span>
                          <span>Success: {wh.successRate}%</span>
                          {wh.lastTriggeredAt && (
                            <span>Last: {new Date(wh.lastTriggeredAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={wh.isActive} onCheckedChange={() => toggleWebhook(wh.id)} />
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(wh.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
