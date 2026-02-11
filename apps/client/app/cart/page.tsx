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
  const { items, currency, removeItem, updateQuantity, clear, subtotal } = useCart();
  const [notes, setNotes] = useState('');
  const [customItems, setCustomItems] = useState<
    { name: string; url: string; size?: string; color?: string; quantity: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

  const total = subtotal();

  const startCheckout = () => {
    const intent = {
      currency,
      subtotal: total,
      items,
      customItems,
      notes,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('uk2me-checkout-intent', JSON.stringify(intent));
    router.push('/pay');
  };

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
                      <div className="text-sm text-muted-foreground">{currency} {(item.priceGBP ?? 0).toFixed(2)}</div>
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
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{currency} {total.toFixed(2)}</span>
                </div>
                <Button className="w-full" variant="outline" onClick={startCheckout}>Proceed to checkout</Button>
                <Button className="w-full" onClick={submitQuote} disabled={loading}>
                  {loading ? 'Submitting...' : 'Request a Quote'}
                </Button>
                <Button variant="ghost" className="w-full" onClick={clear}>Clear cart</Button>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Notes (optional)</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-border bg-background p-3 text-sm"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
