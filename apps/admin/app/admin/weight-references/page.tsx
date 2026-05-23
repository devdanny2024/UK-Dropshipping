'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Scale } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

type WeightRef = {
  id: string;
  category: string;
  label: string;
  actualWeightGrams: number | null;
  chargeableWeightGrams: number;
  isNamedProduct: boolean;
  notes: string | null;
  createdAt: string;
};

const apiBase = '/api/proxy/admin';

const CATEGORY_OPTIONS = [
  'womens-clothing',
  'mens-clothing',
  'childrens-clothing',
  'footwear',
  'accessories',
  'electronics',
  'home-kitchen',
  'beauty-perfume',
  'sports',
  'luxury',
  'other'
];

function gToKg(grams: number | null): string {
  if (grams === null) return '-';
  return `${(grams / 1000).toFixed(3)} kg`;
}

export default function WeightReferencesPage() {
  const [refs, setRefs] = useState<WeightRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WeightRef | null>(null);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [formIsNamed, setFormIsNamed] = useState(false);
  const [formCategory, setFormCategory] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/weight-references`, { credentials: 'include' });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload?.error?.message ?? 'Failed to load weight references');
      setRefs(payload.data.weightReferences ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weight references');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const actualGrams = formData.get('actualWeightGrams');
    const payload = {
      category: formCategory || String(formData.get('category') ?? ''),
      label: String(formData.get('label') ?? ''),
      actualWeightGrams: actualGrams ? Number(actualGrams) : undefined,
      chargeableWeightGrams: Number(formData.get('chargeableWeightGrams') ?? 0),
      isNamedProduct: formIsNamed,
      notes: String(formData.get('notes') ?? '') || undefined
    };

    const url = editing ? `${apiBase}/weight-references/${editing.id}` : `${apiBase}/weight-references`;
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data?.error?.message ?? 'Failed to save weight reference');
      return;
    }
    setOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (ref: WeightRef) => {
    if (!confirm(`Delete weight reference "${ref.label}"?`)) return;
    const res = await fetch(`${apiBase}/weight-references/${ref.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data?.error?.message ?? 'Failed to delete weight reference');
      return;
    }
    setRefs((prev) => prev.filter((item) => item.id !== ref.id));
  };

  const filtered = useMemo(() => {
    return refs.filter((ref) => {
      if (filterCategory !== 'all' && ref.category !== filterCategory) return false;
      if (filterType === 'named' && !ref.isNamedProduct) return false;
      if (filterType === 'category' && ref.isNamedProduct) return false;
      return true;
    });
  }, [refs, filterCategory, filterType]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Scale className="h-6 w-6" />
            Weight References
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Category fallback weights and named product weights used for shipping cost calculations.
            Rate: configured per kg in Settings.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setFormIsNamed(false);
                setFormCategory('');
              }}
            >
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit weight reference' : 'New weight reference'}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formCategory || editing?.category || ''}
                    onValueChange={setFormCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="category" value={formCategory || editing?.category || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Label / Product name</Label>
                  <Input id="label" name="label" defaultValue={editing?.label ?? ''} required placeholder="e.g. jeans or Court Heels UK8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actualWeightGrams">Actual weight (grams)</Label>
                  <Input id="actualWeightGrams" name="actualWeightGrams" type="number" min="1" defaultValue={editing?.actualWeightGrams ?? ''} placeholder="optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chargeableWeightGrams">Chargeable weight (grams) *</Label>
                  <Input id="chargeableWeightGrams" name="chargeableWeightGrams" type="number" min="1" required defaultValue={editing?.chargeableWeightGrams ?? ''} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isNamedProduct">Named product (real shipment data)</Label>
                  <p className="text-xs text-muted-foreground">Enable for specific product weights; leave off for category fallbacks</p>
                </div>
                <Switch
                  id="isNamedProduct"
                  checked={editing ? formIsNamed : formIsNamed}
                  onCheckedChange={setFormIsNamed}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" name="notes" defaultValue={editing?.notes ?? ''} rows={2} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="submit">{editing ? 'Save changes' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weight reference table</CardTitle>
          <CardDescription>
            Chargeable weight is used to compute shipping cost: weight_kg &times; rate_per_kg.
            Category fallbacks are used when no product-specific weight is found.
            Named product entries take precedence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="named">Named products</SelectItem>
                <SelectItem value="category">Category fallbacks</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground self-center">{filtered.length} entries</span>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground py-4">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">No entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actual wt.</TableHead>
                    <TableHead>Chargeable wt.</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="text-sm font-mono">{ref.category}</TableCell>
                      <TableCell className="font-medium">{ref.label}</TableCell>
                      <TableCell>
                        <Badge variant={ref.isNamedProduct ? 'default' : 'secondary'}>
                          {ref.isNamedProduct ? 'Named' : 'Fallback'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{gToKg(ref.actualWeightGrams)}</TableCell>
                      <TableCell className="text-sm font-medium">{gToKg(ref.chargeableWeightGrams)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{ref.notes ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(ref);
                            setFormIsNamed(ref.isNamedProduct);
                            setFormCategory(ref.category);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(ref)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
