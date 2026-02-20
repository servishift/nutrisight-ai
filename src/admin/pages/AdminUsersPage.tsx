import { useState } from 'react';
import {
  Search, Filter, MoreHorizontal, UserCheck, UserX, Trash2, Eye, Download, Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface UserRow {
  id: string;
  displayName: string;
  email: string;
  plan: string;
  emailVerified: boolean;
  isActive: boolean;
  analysisCount: number;
  createdAt: string;
  lastLoginAt: string;
}

const MOCK_USERS: UserRow[] = [
  { id: '1', displayName: 'Sarah Chen', email: 'sarah@example.com', plan: 'pro', emailVerified: true, isActive: true, analysisCount: 245, createdAt: '2025-01-15', lastLoginAt: '2 hours ago' },
  { id: '2', displayName: 'Mike Johnson', email: 'mike@example.com', plan: 'free', emailVerified: true, isActive: true, analysisCount: 12, createdAt: '2025-02-20', lastLoginAt: '1 day ago' },
  { id: '3', displayName: 'Emily Davis', email: 'emily@example.com', plan: 'enterprise', emailVerified: true, isActive: true, analysisCount: 1089, createdAt: '2024-11-03', lastLoginAt: '5 min ago' },
  { id: '4', displayName: 'Alex Kim', email: 'alex@example.com', plan: 'free', emailVerified: false, isActive: false, analysisCount: 0, createdAt: '2025-03-10', lastLoginAt: 'Never' },
  { id: '5', displayName: 'Priya Sharma', email: 'priya@example.com', plan: 'pro', emailVerified: true, isActive: true, analysisCount: 523, createdAt: '2024-12-22', lastLoginAt: '30 min ago' },
  { id: '6', displayName: 'Tom Wilson', email: 'tom@example.com', plan: 'free', emailVerified: true, isActive: true, analysisCount: 87, createdAt: '2025-01-28', lastLoginAt: '3 days ago' },
];

const planColor: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-accent/10 text-accent-foreground',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserRow | null>(null);

  const filtered = MOCK_USERS.filter((u) => {
    const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.plan === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">{MOCK_USERS.length} registered users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add User</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Analyses</TableHead>
                <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {u.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${planColor[u.plan] || ''}`}>
                      {u.plan}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={u.isActive ? 'default' : 'secondary'} className="text-xs">
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{u.analysisCount}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{u.lastLoginAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewUser(u)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {u.isActive ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm(u)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View detail dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>{viewUser?.email}</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="grid gap-3 text-sm">
              <Row label="Name" value={viewUser.displayName} />
              <Row label="Email" value={viewUser.email} />
              <Row label="Plan" value={viewUser.plan} />
              <Row label="Email Verified" value={viewUser.emailVerified ? 'Yes' : 'No'} />
              <Row label="Status" value={viewUser.isActive ? 'Active' : 'Inactive'} />
              <Row label="Analyses" value={String(viewUser.analysisCount)} />
              <Row label="Joined" value={viewUser.createdAt} />
              <Row label="Last Login" value={viewUser.lastLoginAt} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.displayName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setDeleteConfirm(null)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
