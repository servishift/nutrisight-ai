import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, FlaskConical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Additive } from '../types/admin';

const CATEGORIES = ['preservative', 'color', 'sweetener', 'emulsifier', 'antioxidant', 'flavor', 'stabilizer', 'other'] as const;
const RISK_LEVELS = ['low', 'moderate', 'high'] as const;

const MOCK: Additive[] = [
  { id: '1', code: 'E100', name: 'Curcumin', category: 'color', riskLevel: 'low', description: 'Natural yellow colour from turmeric', source: 'Turmeric root', bannedIn: [], createdAt: '2025-01-10', updatedAt: '2025-01-10' },
  { id: '2', code: 'E102', name: 'Tartrazine', category: 'color', riskLevel: 'high', description: 'Synthetic yellow dye linked to hyperactivity', source: 'Synthetic', bannedIn: ['Norway', 'Austria'], createdAt: '2025-01-10', updatedAt: '2025-01-10' },
  { id: '3', code: 'E211', name: 'Sodium Benzoate', category: 'preservative', riskLevel: 'moderate', description: 'Preservative used in acidic foods', source: 'Synthetic', bannedIn: [], createdAt: '2025-01-10', updatedAt: '2025-01-10' },
  { id: '4', code: 'E621', name: 'Monosodium Glutamate', category: 'flavor', riskLevel: 'moderate', description: 'Flavour enhancer commonly known as MSG', source: 'Fermentation', bannedIn: [], createdAt: '2025-01-10', updatedAt: '2025-01-10' },
  { id: '5', code: 'E951', name: 'Aspartame', category: 'sweetener', riskLevel: 'high', description: 'Artificial sweetener, 200x sweeter than sugar', source: 'Synthetic', bannedIn: [], createdAt: '2025-01-10', updatedAt: '2025-01-10' },
];

const riskColor: Record<string, string> = {
  low: 'bg-success/10 text-success',
  moderate: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
};

const emptyForm = (): Omit<Additive, 'id' | 'createdAt' | 'updatedAt'> => ({
  code: '', name: '', category: 'other', riskLevel: 'low', description: '', source: '', bannedIn: [],
});

export default function AdminAdditivesPage() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [data, setData] = useState(MOCK);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<Additive | null>(null);

  const filtered = data.filter((a) => {
    const matchSearch = a.code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || a.category === catFilter;
    return matchSearch && matchCat;
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (a: Additive) => {
    setEditId(a.id);
    setForm({ code: a.code, name: a.name, category: a.category, riskLevel: a.riskLevel, description: a.description, source: a.source, bannedIn: a.bannedIn });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      setData((prev) => prev.map((a) => a.id === editId ? { ...a, ...form, updatedAt: new Date().toISOString().slice(0, 10) } : a));
    } else {
      setData((prev) => [...prev, { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) }]);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteConfirm) setData((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Additives Database</h1>
          <p className="text-sm text-muted-foreground">{data.length} additives registered</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> Add Additive</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by code or name…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-44">
                <FlaskConical className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="hidden lg:table-cell">Banned In</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-sm font-medium">{a.code}</TableCell>
                  <TableCell className="text-sm font-medium">{a.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="capitalize text-xs">{a.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${riskColor[a.riskLevel]}`}>
                      {a.riskLevel}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {a.bannedIn.length > 0 ? a.bannedIn.join(', ') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(a)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No additives found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Additive' : 'Add Additive'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input placeholder="E100" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Curcumin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select value={form.riskLevel} onValueChange={(v: any) => setForm({ ...form, riskLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input placeholder="Natural / Synthetic" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Banned In (comma-separated)</Label>
              <Input placeholder="Norway, Austria" value={form.bannedIn.join(', ')} onChange={(e) => setForm({ ...form, bannedIn: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Additive</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteConfirm?.code} — {deleteConfirm?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
