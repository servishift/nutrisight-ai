import { useState, useEffect } from 'react';
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
import { getUsers, deleteUser as deleteUserApi, toggleUserStatus, createUser, exportUsers } from '../services/admin-api';
import { useToast } from '@/hooks/use-toast';
import type { ManagedUser } from '../types/admin';
import { Label } from '@/components/ui/label';



const planColor: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-accent/10 text-accent-foreground',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewUser, setViewUser] = useState<ManagedUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ManagedUser | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', role: 'user' });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data.users);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
      toast({ title: 'Success', description: 'User status updated' });
      loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUserApi(deleteConfirm.uid);
      toast({ title: 'Success', description: 'User deleted' });
      setDeleteConfirm(null);
      loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({ title: 'Error', description: 'Email and password required', variant: 'destructive' });
      return;
    }
    try {
      await createUser(newUser);
      toast({ title: 'Success', description: 'User created successfully' });
      setAddUserOpen(false);
      setNewUser({ email: '', password: '', displayName: '', role: 'user' });
      loadUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create user', variant: 'destructive' });
    }
  };

  const handleExport = async () => {
    try {
      await exportUsers();
      toast({ title: 'Success', description: 'Users exported successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export users', variant: 'destructive' });
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = (u.displayName || u.email).toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} registered users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          <Button size="sm" onClick={() => setAddUserOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add User</Button>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(u.displayName || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.displayName || 'No name'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${planColor[u.role] || 'bg-muted text-muted-foreground'}`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={u.disabled ? 'secondary' : 'default'} className="text-xs">
                      {u.disabled ? 'Inactive' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{u.analysisCount || 0}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{u.lastLoginAt || 'Never'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleToggleStatus(u.uid)}>
                          {!u.disabled ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                          {!u.disabled ? 'Deactivate' : 'Activate'}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>{viewUser?.email}</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="grid gap-4 text-sm">
              <div className="grid gap-3">
                <h3 className="font-semibold">Basic Information</h3>
                <Row label="Name" value={viewUser.displayName || 'No name'} />
                <Row label="Email" value={viewUser.email} />
                <Row label="Role" value={viewUser.role} />
                <Row label="Email Verified" value={viewUser.emailVerified ? 'Yes' : 'No'} />
                <Row label="Status" value={viewUser.disabled ? 'Inactive' : 'Active'} />
                <Row label="Joined" value={new Date(viewUser.createdAt).toLocaleDateString()} />
                <Row label="Last Login" value={viewUser.lastLoginAt ? new Date(viewUser.lastLoginAt).toLocaleString() : 'Never'} />
              </div>
              <div className="grid gap-3 border-t pt-3">
                <h3 className="font-semibold">Activity Statistics</h3>
                <Row label="Total Analyses" value={String(viewUser.analysisCount || 0)} />
                {(viewUser as any).totalAllergens !== undefined && (
                  <>
                    <Row label="Total Allergens Detected" value={String((viewUser as any).totalAllergens)} />
                    <Row label="Total Additives Detected" value={String((viewUser as any).totalAdditives)} />
                    <Row label="Avg Clean Label Score" value={String((viewUser as any).avgCleanScore)} />
                    <Row label="Avg Health Risk Score" value={String((viewUser as any).avgHealthScore)} />
                  </>
                )}
              </div>
              {(viewUser as any).recentActivity && (viewUser as any).recentActivity.length > 0 && (
                <div className="grid gap-3 border-t pt-3">
                  <h3 className="font-semibold">Recent Activity</h3>
                  <div className="space-y-2">
                    {(viewUser as any).recentActivity.map((activity: any, i: number) => (
                      <div key={i} className="rounded border p-2 text-xs">
                        <p className="font-medium">{activity.ingredientText}</p>
                        <div className="mt-1 flex gap-3 text-muted-foreground">
                          <span>Clean: {activity.cleanLabelScore}</span>
                          <span>Risk: {activity.healthRiskScore}</span>
                          {activity.category && <span>Category: {activity.category}</span>}
                          <span>{activity.analyzedAt ? new Date(activity.analyzedAt).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              Are you sure you want to delete <strong>{deleteConfirm?.displayName || deleteConfirm?.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add user dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="user@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} placeholder="Min 6 characters" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input id="displayName" value={newUser.displayName} onChange={(e) => setNewUser({...newUser, displayName: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(val) => setNewUser({...newUser, role: val})}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Create User</Button>
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
