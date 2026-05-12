'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, MapPin, Loader2, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { useCart } from '@/app/components/cart/use-cart';

type DeliveryType = 'door' | 'pickup';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('door');
  const [doorFee, setDoorFee] = useState(15);
  const [pickupFee, setPickupFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/proxy/v1/checkout/fees')
      .then((r) => r.json())
      .then((p) => {
        if (p?.ok) {
          if (typeof p.data?.doorFee === 'number') setDoorFee(p.data.doorFee);
          if (typeof p.data?.pickupFee === 'number') setPickupFee(p.data.pickupFee);
        }
      })
      .catch(() => undefined);
  }, []);

  const cartTotal = subtotal();
  const deliveryFee = deliveryType === 'door' ? doorFee : pickupFee;
  const grandTotal = cartTotal + deliveryFee;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map((item) => ({
            name: item.name,
            imageUrl: item.imageUrl,
            priceGBP: item.priceGBP ?? 0,
            quantity: item.quantity,
            externalUrl: item.externalUrl,
            productCode: item.productCode,
            categoryName: item.categoryName,
          })),
          address: {
            recipientName: form.recipientName,
            phone: form.phone,
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state || undefined,
            postalCode: form.postalCode || undefined,
            country: form.country,
          },
          deliveryType,
          notes: form.notes || undefined,
        }),
      });
      const payload = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=/checkout`);
        return;
      }
      if (!res.ok || !payload.ok) {
        throw new Error(payload?.error?.message ?? 'Checkout failed. Try again.');
      }
      clear();
      router.push(`/pay?orderId=${payload.data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">Your cart is empty</h2>
          <Button onClick={() => router.push('/shop')} style={{ background: 'var(--brand-violet)' }}>
            Browse products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button variant="ghost" className="gap-2 -ml-2 mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Button>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
            <div className="space-y-6">
              {/* Delivery Method */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Delivery Method</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('door')}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      deliveryType === 'door'
                        ? 'border-[var(--brand-violet)] bg-violet-50 dark:bg-violet-950/20'
                        : 'border-border hover:border-[var(--brand-violet)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="h-4 w-4" style={{ color: 'var(--brand-violet)' }} />
                      <span className="font-semibold text-sm">Door Delivery</span>
                      {deliveryType === 'door' && <Badge className="ml-auto text-xs bg-violet-100 text-violet-700 border-violet-200">Selected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Delivered to your address</p>
                    <p className="text-sm font-bold mt-2" style={{ color: 'var(--brand-violet)' }}>
                      {doorFee === 0 ? 'Free' : `+£${doorFee.toFixed(2)}`}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-[var(--brand-violet)] bg-violet-50 dark:bg-violet-950/20'
                        : 'border-border hover:border-[var(--brand-violet)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4" style={{ color: 'var(--brand-violet)' }} />
                      <span className="font-semibold text-sm">Pickup</span>
                      {deliveryType === 'pickup' && <Badge className="ml-auto text-xs bg-violet-100 text-violet-700 border-violet-200">Selected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Collect from our pickup point</p>
                    <p className="text-sm font-bold mt-2" style={{ color: 'var(--brand-violet)' }}>
                      {pickupFee === 0 ? 'Free' : `+£${pickupFee.toFixed(2)}`}
                    </p>
                  </button>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4" style={{ color: 'var(--brand-violet)' }} />
                    {deliveryType === 'door' ? 'Delivery Address' : 'Contact Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="recipientName">Full name *</Label>
                      <Input id="recipientName" value={form.recipientName} onChange={set('recipientName')} placeholder="John Doe" required minLength={2} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone number *</Label>
                      <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="+234 800 000 0000" required minLength={6} />
                    </div>
                  </div>

                  {deliveryType === 'door' && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="line1">Address line 1 *</Label>
                        <Input id="line1" value={form.line1} onChange={set('line1')} placeholder="12 Adeola Odeku Street" required minLength={3} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="line2">Address line 2 <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input id="line2" value={form.line2} onChange={set('line2')} placeholder="Victoria Island" />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="city">City *</Label>
                          <Input id="city" value={form.city} onChange={set('city')} placeholder="Lagos" required minLength={2} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="state">State</Label>
                          <Input id="state" value={form.state} onChange={set('state')} placeholder="Lagos State" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="postalCode">Postcode</Label>
                          <Input id="postalCode" value={form.postalCode} onChange={set('postalCode')} placeholder="100001" />
                        </div>
                      </div>
                    </>
                  )}

                  {deliveryType === 'pickup' && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm">
                      <p className="font-semibold text-amber-800 dark:text-amber-400 mb-1">Pickup Location</p>
                      <p className="text-amber-700 dark:text-amber-500">Our team will contact you on the number above with the pickup address when your order arrives from the UK.</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Order notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <textarea
                      id="notes"
                      className="w-full min-h-[70px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Specific colour, size, or special instructions…"
                      value={form.notes}
                      onChange={set('notes')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {items.map((item) => {
                      const key = item.productId ?? item.slug ?? item.externalUrl ?? item.name;
                      return (
                        <div key={key} className="flex items-center gap-2.5">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                          </div>
                          <span className="text-xs font-semibold shrink-0">£{((item.priceGBP ?? 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>£{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span>{deliveryFee === 0 ? 'Free' : `£${deliveryFee.toFixed(2)}`}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span style={{ color: 'var(--brand-violet)' }}>£{grandTotal.toFixed(2)}</span>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2 h-12 text-base font-semibold mt-2"
                    style={{ background: 'var(--brand-violet)' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Creating order…</>
                    ) : (
                      'Confirm & Proceed to Payment'
                    )}
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    Your order will be confirmed after payment
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
