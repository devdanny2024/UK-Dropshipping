'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, CheckCircle, Loader2, ShieldCheck, Zap, Package, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

function SimulatedSuccess({ orderId }: { orderId: string }) {
  const router = useRouter();
  const fakeOrderRef = `UK2ME-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <Card className="text-center border-2" style={{ borderColor: 'var(--brand-violet)' }}>
          <CardContent className="p-10 space-y-5">
            <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED20, #7C3AED40)' }}>
              <CheckCircle className="h-10 w-10" style={{ color: 'var(--brand-violet)' }} />
            </div>
            <div>
              <Badge className="mb-3 bg-green-100 text-green-700 border-green-200">Payment Simulated ✓</Badge>
              <h2 className="text-2xl font-bold">Order Confirmed!</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Your order has been placed and our team will begin processing it shortly.
              </p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order reference</span>
                <span className="font-mono font-bold" style={{ color: 'var(--brand-violet)' }}>{fakeOrderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className="text-xs">Processing</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email notification</span>
                <span className="text-xs text-green-600 font-medium">Sent ✓</span>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Button className="w-full gap-2" style={{ background: 'var(--brand-violet)' }} onClick={() => router.push('/orders')}>
                <Package className="h-4 w-4" /> Track My Order
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/shop')}>
                Continue Shopping
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              A confirmation email has been sent. You will receive live updates as your order progresses.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientPaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState<'paystack' | 'stripe' | 'simulate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gbpTotal, setGbpTotal] = useState<string | null>(null);
  const [ngnAmount, setNgnAmount] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const id = params.get('orderId') ?? '';
    setOrderId(id);
    const raw = localStorage.getItem('uk2me-active-quote') ?? localStorage.getItem('uk2me-checkout-intent');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const total = parsed?.total ?? parsed?.subtotal;
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
    if (!orderId) { setError('No order ID found. Please start from the product page.'); return; }
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
      if (!res.ok || !payload.ok) throw new Error(payload?.error?.message ?? 'Payment initialization failed');
      window.location.assign(payload.data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setLoading(null);
    }
  };

  const simulatePayment = async () => {
    if (!orderId) {
      setError('No order ID found. Please go through checkout first.');
      return;
    }
    setLoading('simulate');
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        throw new Error(payload?.error?.message ?? 'Simulation failed. Try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed.');
      setLoading(null);
      return;
    }
    setLoading(null);
    setSuccess(true);
  };

  if (success) return <SimulatedSuccess orderId={orderId} />;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-2xl space-y-5">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Test mode banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
          <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-amber-800 dark:text-amber-400">Demo / Test Mode</span>
            <span className="text-amber-700 dark:text-amber-500 ml-1">— Payment gateway not yet configured. Use the simulate button below to test the full checkout flow.</span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Complete Payment</CardTitle>
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Secure
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {orderId && (
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Order ID</div>
                <div className="font-mono font-medium">{orderId}</div>
              </div>
            )}

            {(gbpTotal || ngnAmount != null) && (
              <div className="rounded-lg border border-border p-4 space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Order Total</div>
                {gbpTotal && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">GBP amount</span>
                    <span className="font-bold text-lg">{gbpTotal}</span>
                  </div>
                )}
                {ngnAmount != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">NGN equivalent</span>
                    <span className="font-medium">₦{ngnAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
            )}

            <Separator />

            {/* Simulate payment — always shown for demo */}
            <div className="space-y-3">
              <Button
                className="w-full gap-2 h-12 text-base font-semibold"
                style={{ background: 'var(--brand-violet)' }}
                disabled={loading !== null}
                onClick={simulatePayment}
              >
                {loading === 'simulate' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing payment…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Simulate Payment (Demo)</>
                )}
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground px-2">or pay with real gateway</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                variant="outline"
                onClick={() => startPayment('stripe')}
                disabled={loading !== null}
              >
                <CreditCard className="h-4 w-4" />
                {loading === 'stripe' ? 'Redirecting…' : `Pay ${gbpTotal ?? ''} with Stripe (GBP)`}
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                size="lg"
                onClick={() => startPayment('paystack')}
                disabled={loading !== null}
              >
                <CreditCard className="h-4 w-4" />
                {loading === 'paystack'
                  ? 'Redirecting…'
                  : `Pay ${ngnAmount != null ? `₦${ngnAmount.toLocaleString('en-NG')}` : ''} with Paystack (NGN)`}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Stripe charges in GBP · Paystack charges in Naira at live FX rate · All payments are secure & encrypted
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClientPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ClientPaymentContent />
    </Suspense>
  );
}
