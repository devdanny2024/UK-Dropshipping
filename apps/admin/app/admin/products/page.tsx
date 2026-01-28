'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: Category;
  description?: string | null;
  images?: string[] | null;
  productCode?: string | null;
  externalUrl?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  featuredOrder: number;
  priceGBP?: string | number | null;
  currency?: string | null;
};

const apiBase = '/api/proxy/admin';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${apiBase}/categories`, { credentials: 'include' }),
        fetch(`${apiBase}/products`, { credentials: 'include' })
      ]);
      const catPayload = await catRes.json();
      const prodPayload = await prodRes.json();
      if (!catRes.ok || !catPayload.ok) throw new Error(catPayload?.error?.message ?? 'Failed to load categories');
      if (!prodRes.ok || !prodPayload.ok) throw new Error(prodPayload?.error?.message ?? 'Failed to load products');
      setCategories(catPayload.data.categories ?? []);
      setProducts(prodPayload.data.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
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
    const imagesText = String(formData.get('images') ?? '');
    const images = imagesText
      ? imagesText.split(',').map((value) => value.trim()).filter(Boolean)
      : undefined;

    const payload = {
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? '') || undefined,
      categoryId: String(formData.get('categoryId') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
      images,
      productCode: String(formData.get('productCode') ?? '') || undefined,
      externalUrl: String(formData.get('externalUrl') ?? '') || undefined,
      priceGBP: formData.get('priceGBP') ? Number(formData.get('priceGBP')) : undefined,
      currency: String(formData.get('currency') ?? 'GBP') || 'GBP',
      isActive: Boolean(formData.get('isActive')),
      isFeatured: Boolean(formData.get('isFeatured')),
      featuredOrder: Number(formData.get('featuredOrder') ?? 0)
    };

    const url = editing ? `${apiBase}/products/${editing.id}` : `${apiBase}/products`;
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data?.error?.message ?? 'Failed to save product');
      return;
    }
    setOpen(false);
    setEditing(null);
    await load();
  };

  const toggleActive = async (product: Product) => {
    const res = await fetch(`${apiBase}/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !product.isActive })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, isActive: !product.isActive } : item)));
    }
  };

  const toggleFeatured = async (product: Product) => {
    const res = await fetch(`${apiBase}/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isFeatured: !product.isFeatured })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, isFeatured: !product.isFeatured } : item)));
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete product ${product.name}?`)) return;
    const res = await fetch(`${apiBase}/products/${product.id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data?.error?.message ?? 'Failed to delete product');
      return;
    }
    setProducts((prev) => prev.filter((item) => item.id !== product.id));
  };

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (filterCategory !== 'all' && product.categoryId !== filterCategory) return false;
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, filterCategory, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage catalogue products and featured items.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setFormCategoryId('');
                setFormIsActive(true);
                setFormIsFeatured(false);
              }}
            >
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit product' : 'Create product'}</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing?.name ?? ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={editing?.slug ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={formCategoryId || editing?.categoryId || ''}
                  onValueChange={(value) => setFormCategoryId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="categoryId" value={formCategoryId || editing?.categoryId || ''} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description ?? ''} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="images">Images (comma separated URLs)</Label>
                <Input id="images" name="images" defaultValue={Array.isArray(editing?.images) ? editing?.images?.join(', ') : ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productCode">Product code</Label>
                <Input id="productCode" name="productCode" defaultValue={editing?.productCode ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="externalUrl">External URL</Label>
                <Input id="externalUrl" name="externalUrl" defaultValue={editing?.externalUrl ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceGBP">Price (GBP)</Label>
                <Input id="priceGBP" name="priceGBP" type="number" step="0.01" defaultValue={editing?.priceGBP ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue={editing?.currency ?? 'GBP'} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={editing ? formIsActive : formIsActive}
                  onCheckedChange={(value) => setFormIsActive(value)}
                />
                <input type="hidden" name="isActive" value={formIsActive ? 'true' : ''} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured</Label>
                <Switch
                  id="isFeatured"
                  checked={editing ? formIsFeatured : formIsFeatured}
                  onCheckedChange={(value) => setFormIsFeatured(value)}
                />
                <input type="hidden" name="isFeatured" value={formIsFeatured ? 'true' : ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuredOrder">Featured order</Label>
                <Input id="featuredOrder" name="featuredOrder" type="number" defaultValue={editing?.featuredOrder ?? 0} />
              </div>
              {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
              <DialogFooter className="md:col-span-2">
                <Button type="submit">{editing ? 'Save changes' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Switch checked={product.isActive} onCheckedChange={() => toggleActive(product)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleFeatured(product)}>
                        <Star className={product.isFeatured ? 'h-4 w-4 text-yellow-500' : 'h-4 w-4'} />
                      </Button>
                    </TableCell>
                    <TableCell>{product.featuredOrder}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(product);
                          setFormCategoryId(product.categoryId);
                          setFormIsActive(product.isActive);
                          setFormIsFeatured(product.isFeatured);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
