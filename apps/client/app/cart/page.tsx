'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck, Package } from 'lucide-react';
import { useCart } from '@/app/components/cart/use-cart';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import Link from 'next/link';

export default function CartPage() {
  const { items, currency, removeItem, updateQuantity, clear, subtotal } = useCart();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';
  const total = subtotal();

  const startCheckout = () => {
    const intent = { currency, subtotal: total, items, notes, createdAt: new Date().toISOString() };
    localStorage.setItem('uk2me-checkout-intent', JSON.stringify(intent));
    router.push('/checkout');
  };

  const submitQuote = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/orders/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, notes })
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-20">
        <div className="text-center space-y-5 max-w-sm mx-auto px-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-9 w-9 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground mt-2 text-sm">Browse UK products or paste a product link to get started.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild style={{ background: 'var(--brand-violet)' }}>
              <Link href="/shop">Browse products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/preview">Paste a link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <p className="text-muted-foreground mt-1">{items.length} item{items.length !== 1 ? 's' : ''} ready for checkout</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          {/* Items */}
          <div className="space-y-4">
            {items.map((item) => {
              const key = item.productId ?? item.slug ?? item.externalUrl ?? '';
              return (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 rounded-xl bg-muted overflow-hidden shrink-0">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm leading-snug">{item.name}</h3>
                            {item.categoryName && (
                              <Badge variant="secondary" className="mt-1 text-[10px]">{item.categoryName}</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeItem(key)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="text-base font-bold" style={{ color: 'var(--brand-violet)' }}>
                          {currency} {(item.priceGBP ?? 0).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(key, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(key, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          {item.quantity > 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              = {currency} {((item.priceGBP ?? 0) * item.quantity).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Notes */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <label className="text-sm font-medium">Order notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  className="w-full min-h-[80px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Specific size, colour, or delivery instructions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" style={{ color: 'var(--brand-violet)' }} />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span className="font-medium">{currency} {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping quote</span>
                  <span className="text-muted-foreground italic text-xs">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="text-muted-foreground italic text-xs">Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Estimated Total</span>
                  <span style={{ color: 'var(--brand-violet)' }}>{currency} {total.toFixed(2)}+</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Final cost includes shipping, service fee & duties</p>

                <Button
                  className="w-full gap-2 mt-2"
                  size="lg"
                  style={{ background: 'var(--brand-violet)' }}
                  onClick={startCheckout}
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={submitQuote}
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Request a Quote'}
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={clear}>
                  Clear cart
                </Button>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <Card className="bg-secondary/40 border-0">
              <CardContent className="p-4 space-y-2.5">
                {[
                  [ShieldCheck, 'Secure & encrypted payments'],
                  [Truck, 'UK to Nigeria — fully tracked'],
                  [Package, 'Transparent pricing, no surprises'],
                ].map(([Icon, label]: any) => (
                  <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-violet)' }} />
                    {label}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
