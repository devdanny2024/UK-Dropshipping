'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

function ClientPaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteTotal, setQuoteTotal] = useState<string | null>(null);

  useEffect(() => {
    setOrderId(params.get('orderId') ?? '');

    const raw = localStorage.getItem('uk2me-quote-summary');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const total = parsed?.breakdown?.total;
      if (typeof total === 'number') setQuoteTotal(`GBP ${total.toFixed(2)}`);
    } catch {
      // noop
    }
  }, [params]);

  const startPayment = async () => {
    if (!orderId) {
      setError('Order ID is required to initialize payment');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, redirectPath: '/pay/callback' })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload?.error?.message ?? 'Failed to initialize payment');
      window.location.assign(payload.data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.push('/quote')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Quote
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Flutterwave Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            {quoteTotal ? <p className="text-sm text-muted-foreground">Latest quote estimate: {quoteTotal}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full gap-2" size="lg" onClick={startPayment} disabled={loading}>
              <CreditCard className="h-4 w-4" />
              {loading ? 'Redirecting...' : 'Pay with Flutterwave'}
            </Button>
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
