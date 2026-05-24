'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { useCurrency } from '@/app/hooks/use-currency';

type Quote = {
  id: string;
  subtotal: number;
  shipping: number;
  tax: number;
  platformFee?: number;
  total: number;
  currency: string;
  qty: number;
  size: string;
  color: string;
};

function QuoteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const quoteId = params.get('quoteId');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    const raw = localStorage.getItem('uk2me-active-quote');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!quoteId || parsed?.id === quoteId) setQuote(parsed);
    } catch {
      // ignore
    }
  }, [quoteId]);

  const handleProceed = async () => {
    if (!quoteId) return;
    setOrderLoading(true);
    setOrderError(null);
    try {
      const res = await fetch('/api/proxy/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quoteId })
      });
      const payload = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.href)}`);
        return;
      }
      if (!res.ok || !payload.ok) {
        throw new Error(payload?.error?.message ?? 'Failed to create order');
      }
      router.push(`/pay?orderId=${payload.data.id}`);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setOrderLoading(false);
    }
  };

  if (!quote) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="gap-2 mb-6" onClick={() => router.push('/preview')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Preview
          </Button>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No quote found.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/preview')}>
                Create a new one
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Quote Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{quote.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Colour</span>
                <span>{quote.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{quote.qty}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatAmount(quote.subtotal, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatAmount(quote.shipping, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (6%)</span>
                <span>{formatAmount(quote.tax, quote.currency)}</span>
              </div>
              {quote.platformFee != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span>{formatAmount(quote.platformFee, quote.currency)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatAmount(quote.total, quote.currency)}</span>
            </div>
            {orderError && <p className="text-sm text-destructive">{orderError}</p>}
            <Button className="w-full gap-2" size="lg" onClick={handleProceed} disabled={orderLoading}>
              {orderLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {orderLoading ? 'Creating order...' : 'Proceed to Payment'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClientQuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-12" />}>
      <QuoteContent />
    </Suspense>
  );
}
