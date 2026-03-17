import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Key, Plus, Copy, Trash2, Eye, EyeOff, Shield, Clock, Activity, Loader2, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createApiKey, listApiKeys, revokeApiKey } from '@/services/phase4-api';
import type { ApiKey } from '@/types/phase4';

const DEMO_KEYS: ApiKey[] = [
  {
    id: '1', name: 'Production App', key: 'fi_live_****7f3a', prefix: 'fi_live_',
    environment: 'live', permissions: ['analyze', 'similarity', 'brand', 'reformulation'],
    createdAt: '2025-01-15T10:00:00Z', lastUsedAt: '2025-02-22T14:32:00Z',
    expiresAt: null, isActive: true, requestCount: 12847,
  },
  {
    id: '2', name: 'Staging Tests', key: 'fi_test_****b2e1', prefix: 'fi_test_',
    environment: 'test', permissions: ['analyze', 'similarity'],
    createdAt: '2025-02-01T08:00:00Z', lastUsedAt: '2025-02-20T09:15:00Z',
    expiresAt: '2025-06-01T00:00:00Z', isActive: true, requestCount: 523,
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEnv, setNewEnv] = useState<'live' | 'test'>('live');
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await listApiKeys();
      setKeys(data.keys || []);
    } catch (error: any) {
      console.error('Failed to load keys:', error);
      if (error.message?.includes('login')) {
        toast({ title: 'Please login', description: 'You need to be logged in to manage API keys', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to load API keys', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const data = await createApiKey(newName || 'Untitled Key', 'free');
      setNewKeyData(data);
      await loadKeys();
      toast({ title: 'API key created', description: 'Save your key now - it won\'t be shown again!' });
    } catch (error: any) {
      console.error('Failed to create key:', error);
      if (error.message?.includes('login')) {
        toast({ title: 'Please login', description: 'You need to be logged in to create API keys', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to create API key', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
      setNewName('');
    }
  };

  const toggleKey = (id: string) => {
    setKeys(keys.map((k) => (k.id === id ? { ...k, isActive: !k.isActive } : k)));
  };

  const deleteKey = async (id: string) => {
    try {
      await revokeApiKey(id);
      await loadKeys();
      toast({ title: 'Key revoked' });
    } catch (error) {
      console.error('Failed to revoke key:', error);
      toast({ title: 'Failed to revoke key', variant: 'destructive' });
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <PageLayout>
      <div className="container py-10 md:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">Phase 4</Badge>
              <Badge variant="outline" className="border-accent/30 text-accent">SaaS</Badge>
            </div>
            <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
              <Key className="mr-2 inline h-8 w-8 text-primary" />
              API Keys
            </h1>
            <p className="text-muted-foreground">Manage your API credentials for programmatic access</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>Generate a new key for API access.</DialogDescription>
              </DialogHeader>
              {newKeyData ? (
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                    <p className="mb-2 text-sm font-semibold text-foreground">Your API Key</p>
                    <code className="block rounded bg-muted p-2 text-xs break-all">{newKeyData.key}</code>
                    <p className="mt-2 text-xs text-muted-foreground">⚠️ Save this key now - it won't be shown again!</p>
                  </div>
                  <Button onClick={() => { copyKey(newKeyData.key); setNewKeyData(null); setCreateOpen(false); }} className="w-full">
                    <Copy className="mr-2 h-4 w-4" /> Copy & Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Key Name</label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Production App" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Environment</label>
                      <Select value={newEnv} onValueChange={(v: 'live' | 'test') => setNewEnv(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="test">Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Key, label: 'Total Keys', value: keys.length, color: 'text-primary bg-primary/10' },
            { icon: Shield, label: 'Active', value: keys.filter((k) => k.isActive).length, color: 'text-success bg-success/10' },
            { icon: Activity, label: 'Total Requests', value: keys.reduce((s, k) => s + (k.requestCount || 0), 0).toLocaleString(), color: 'text-accent bg-accent/10' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Keys table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Env</TableHead>
                    <TableHead className="hidden sm:table-cell">Requests</TableHead>
                    <TableHead className="hidden md:table-cell">Last Used</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {revealedId === k.id ? `fi_${k.environment}_sk_full_key_here` : k.key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={k.environment === 'live' ? 'default' : 'secondary'} className="text-[10px]">
                          {k.environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{(k.requestCount || 0).toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Switch checked={k.isActive} onCheckedChange={() => toggleKey(k.id)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setRevealedId(revealedId === k.id ? null : k.id)}>
                            {revealedId === k.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => copyKey(k.key)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteKey(k.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
