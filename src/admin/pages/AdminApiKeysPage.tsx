import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Search, Ban, Activity, Users, TrendingUp, Trash2, Eye, Copy, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../services/admin-api';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyData {
  id: string;
  name: string;
  user_id: string;
  user_email: string | null;
  key_prefix: string;
  tier: string;
  is_active: boolean;
  usage_count: number;
  last_used: string | null;
  created_at: string;
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [viewKeyDialog, setViewKeyDialog] = useState<{ open: boolean; key: ApiKeyData | null }>({ open: false, key: null });
  const [copiedKey, setCopiedKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await adminApi.getAllApiKeys();
      setKeys(data.keys || []);
    } catch (error: any) {
      toast({ title: 'Failed to load API keys', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    if (!confirm(`Revoke API key "${keyName}"? This action cannot be undone.`)) return;
    
    try {
      await adminApi.revokeApiKey(keyId);
      await loadKeys();
      toast({ title: 'Success', description: 'API key revoked successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to revoke key', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (keyId: string, keyName: string) => {
    if (!confirm(`Permanently delete API key "${keyName}"? This action cannot be undone and will remove all usage history.`)) return;
    
    try {
      await adminApi.deleteApiKey(keyId);
      await loadKeys();
      toast({ title: 'Success', description: 'API key deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to delete key', description: error.message, variant: 'destructive' });
    }
  };

  const handleViewKey = (key: ApiKeyData) => {
    setViewKeyDialog({ open: true, key });
  };

  const handleCopyKey = async (keyValue: string) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedKey(true);
      toast({ title: 'Copied', description: 'API key copied to clipboard' });
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (error) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const filtered = keys.filter(k => {
    const matchesSearch = k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      k.key_prefix.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && k.is_active) ||
      (statusFilter === 'revoked' && !k.is_active);
    
    const matchesTier = tierFilter === 'all' || k.tier === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const stats = {
    total: keys.length,
    active: keys.filter(k => k.is_active).length,
    totalUsage: keys.reduce((sum, k) => sum + k.usage_count, 0),
    uniqueUsers: new Set(keys.map(k => k.user_id)).size,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">API Keys Management</h1>
        <p className="text-muted-foreground">Monitor and manage all user API keys</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Activity className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All API Keys</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keys..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              {(statusFilter !== 'all' || tierFilter !== 'all' || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setTierFilter('all'); setSearch(''); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No API keys found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{key.user_email || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{key.user_id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{key.key_prefix}...</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.tier === 'enterprise' ? 'default' : key.tier === 'pro' ? 'secondary' : 'outline'}>
                          {key.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{key.usage_count.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Revoked'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewKey(key)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {key.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(key.id, key.name)}
                              className="text-amber-600 hover:text-amber-700"
                              title="Revoke key"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(key.id, key.name)}
                            className="text-destructive hover:text-destructive"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Key Dialog */}
      <Dialog open={viewKeyDialog.open} onOpenChange={(open) => setViewKeyDialog({ open, key: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Key Details</DialogTitle>
            <DialogDescription>Complete information about this API key</DialogDescription>
          </DialogHeader>
          {viewKeyDialog.key && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm font-semibold">{viewKeyDialog.key.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={viewKeyDialog.key.is_active ? 'default' : 'secondary'}>
                    {viewKeyDialog.key.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Email</p>
                  <p className="text-sm">{viewKeyDialog.key.user_email || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-sm font-mono text-xs">{viewKeyDialog.key.user_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tier</p>
                  <Badge variant={viewKeyDialog.key.tier === 'enterprise' ? 'default' : viewKeyDialog.key.tier === 'pro' ? 'secondary' : 'outline'}>
                    {viewKeyDialog.key.tier}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usage Count</p>
                  <p className="text-sm font-semibold">{viewKeyDialog.key.usage_count.toLocaleString()} requests</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(viewKeyDialog.key.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Used</p>
                  <p className="text-sm">{viewKeyDialog.key.last_used ? new Date(viewKeyDialog.key.last_used).toLocaleString() : 'Never'}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">API Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                    {viewKeyDialog.key.key_prefix}••••••••••••••••••••
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyKey(viewKeyDialog.key!.key_prefix)}
                    disabled={copiedKey}
                  >
                    {copiedKey ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">⚠️ Full key is hidden for security. Only the prefix is shown.</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                {viewKeyDialog.key.is_active && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleRevoke(viewKeyDialog.key!.id, viewKeyDialog.key!.name);
                      setViewKeyDialog({ open: false, key: null });
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Revoke Key
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(viewKeyDialog.key!.id, viewKeyDialog.key!.name);
                    setViewKeyDialog({ open: false, key: null });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Key
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
