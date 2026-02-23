import { useState } from 'react';
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
  Webhook, Plus, Trash2, CheckCircle2, XCircle, ExternalLink, RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const DEMO_WEBHOOKS: WebhookConfig[] = [
  {
    id: '1', url: 'https://myapp.com/webhooks/foodintel', events: ['analysis.completed', 'batch.completed'],
    isActive: true, secret: 'whsec_****f3a1', createdAt: '2025-01-20T10:00:00Z',
    lastTriggeredAt: '2025-02-22T14:00:00Z', successRate: 98.5,
  },
  {
    id: '2', url: 'https://staging.myapp.com/hooks/fi', events: ['analysis.completed'],
    isActive: false, secret: 'whsec_****b2e9', createdAt: '2025-02-05T08:00:00Z',
    lastTriggeredAt: '2025-02-18T09:30:00Z', successRate: 95.2,
  },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(DEMO_WEBHOOKS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCreate = () => {
    if (!newUrl.trim() || selectedEvents.length === 0) return;
    const wh: WebhookConfig = {
      id: Date.now().toString(),
      url: newUrl,
      events: selectedEvents,
      isActive: true,
      secret: `whsec_****${Math.random().toString(36).slice(-4)}`,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      successRate: 100,
    };
    setWebhooks([wh, ...webhooks]);
    setCreateOpen(false);
    setNewUrl('');
    setSelectedEvents([]);
    toast({ title: 'Webhook created' });
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
    toast({ title: 'Webhook deleted', variant: 'destructive' });
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
                <Button onClick={handleCreate} disabled={!newUrl.trim() || selectedEvents.length === 0}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {webhooks.length === 0 ? (
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
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteWebhook(wh.id)}>
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
