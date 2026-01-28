'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/app/components/cart/use-cart';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Separator } from '@/app/components/ui/separator';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clear } = useCart();
  const [notes, setNotes] = useState('');
  const [customItems, setCustomItems] = useState<
    { name: string; url: string; size?: string; color?: string; quantity: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

  const total = items.reduce((sum, item) => sum + (item.priceGBP ?? 0) * item.quantity, 0);

  const submitQuote = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/orders/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, notes, customItems })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        alert(payload?.error?.message ?? 'Failed to submit quote request');
        return;
      }
      clear();
      router.push('/quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">Your cart is empty.</div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId ?? item.slug ?? item.externalUrl} className="flex gap-4">
                    <div className="h-20 w-20 rounded-md bg-muted overflow-hidden">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      {item.categoryName && <div className="text-xs text-muted-foreground">{item.categoryName}</div>}
                      <div className="text-sm text-muted-foreground">
                        {item.priceGBP ? `GBP ${item.priceGBP.toFixed(2)}` : 'Request quote'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.productId ?? item.slug ?? item.externalUrl ?? '', Number(event.target.value))}
                        className="w-20"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId ?? item.slug ?? item.externalUrl ?? '')}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator />
              <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-semibold">GBP {total.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Custom link items</div>
                  <CustomItemForm
                    onAdd={(item) => setCustomItems((prev) => [...prev, item])}
                  />
                  {customItems.length > 0 && (
                    <div className="space-y-2">
                      {customItems.map((item, index) => (
                        <div key={`${item.url}-${index}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.url}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setCustomItems((prev) => prev.filter((_, idx) => idx !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Notes (optional)</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-border bg-background p-3 text-sm"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={submitQuote} disabled={loading}>
                  {loading ? 'Submitting...' : 'Request a Quote'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomItemForm({ onAdd }: { onAdd: (item: { name: string; url: string; size?: string; color?: string; quantity: number }) => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!name || !url) return;
    onAdd({ name, url, size: size || undefined, color: color || undefined, quantity });
    setName('');
    setUrl('');
    setSize('');
    setColor('');
    setQuantity(1);
  };

  return (
    <div className="grid gap-2 md:grid-cols-2">
      <Input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Product URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <Input placeholder="Size (optional)" value={size} onChange={(e) => setSize(e.target.value)} />
      <Input placeholder="Color (optional)" value={color} onChange={(e) => setColor(e.target.value)} />
      <Input
        type="number"
        min={1}
        placeholder="Qty"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <Button type="button" variant="outline" onClick={handleAdd}>
        Add custom item
      </Button>
    </div>
  );
}
