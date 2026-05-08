'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

function ClientPaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState<'paystack' | 'stripe' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gbpTotal, setGbpTotal] = useState<string | null>(null);
  const [ngnAmount, setNgnAmount] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const id = params.get('orderId') ?? '';
    setOrderId(id);

    const raw = localStorage.getItem('uk2me-active-quote');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const total = parsed?.total;
      if (typeof total === 'number') {
        setGbpTotal(`£${total.toFixed(2)}`);

        fetch('/api/proxy/v1/fx?base=GBP&symbols=NGN')
          .then((r) => r.json())
          .then((payload) => {
            const rate = payload?.data?.rates?.NGN;
            if (typeof rate === 'number') setNgnAmount(Number((total * rate).toFixed(2)));
          })
          .catch(() => undefined);
      }
    } catch { /* noop */ }
  }, [params]);

  const startPayment = async (provider: 'paystack' | 'stripe') => {
    if (!orderId) {
      setError('No order ID. Please start from the product page.');
      return;
    }
    setLoading(provider);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, provider, redirectPath: '/pay/callback' })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload?.error?.message ?? 'Failed to initialize payment');
      window.location.assign(payload.data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      setConfirmed(true);
    } finally {
      setLoading(null);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-2xl font-semibold">Order Confirmed</h2>
              <p className="text-muted-foreground">
                Order <span className="font-mono font-medium">{orderId}</span> has been placed.
                Our team will process it shortly.
              </p>
              {error && <p className="text-xs text-muted-foreground">(Payment gateway: {error})</p>}
              <Button onClick={() => router.push('/orders')}>View My Orders</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
              <div className="text-muted-foreground">Order</div>
              <div className="font-mono font-medium mt-1">{orderId || '—'}</div>
            </div>

            {(gbpTotal || ngnAmount != null) && (
              <div className="rounded-md border border-border p-4 space-y-2 text-sm">
                {gbpTotal && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order total</span>
                    <span className="font-semibold text-base">{gbpTotal}</span>
                  </div>
                )}
                {ngnAmount != null && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>NGN equivalent</span>
                    <span>₦{ngnAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-3">
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => startPayment('stripe')}
                disabled={loading !== null || !orderId}
              >
                <CreditCard className="h-4 w-4" />
                {loading === 'stripe' ? 'Redirecting...' : `Pay ${gbpTotal ?? ''} with Card / Link`}
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground">or pay in Naira</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                size="lg"
                onClick={() => startPayment('paystack')}
                disabled={loading !== null || !orderId}
              >
                <CreditCard className="h-4 w-4" />
                {loading === 'paystack'
                  ? 'Redirecting...'
                  : `Pay ${ngnAmount != null ? `₦${ngnAmount.toLocaleString('en-NG')}` : ''} with Paystack`}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Card / Link charges in GBP. Paystack charges in Nigerian Naira at the current exchange rate.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClientPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-12" />}>
      <ClientPaymentContent />
    </Suspense>
  );
}
