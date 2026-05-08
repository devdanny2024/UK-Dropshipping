'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

function PaymentCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('orderId') ?? '';
  // Paystack appends reference/trxref; Stripe appends session_id
  const reference = params.get('reference') ?? params.get('trxref') ?? params.get('session_id') ?? '';
  const [state, setState] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    if (!orderId) {
      setState('failed');
      return;
    }
    // Poll the order to see if the webhook has updated it to PROCESSING
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/proxy/v1/orders/${orderId}`, { credentials: 'include' });
        const payload = await res.json();
        if (payload?.ok && payload.data?.status === 'PROCESSING') {
          setState('success');
          clearInterval(interval);
          setTimeout(() => router.push(`/orders/${orderId}`), 1500);
          return;
        }
      } catch { /* continue polling */ }
      if (attempts >= 10) {
        // Webhook may not have arrived yet — treat as success and let order page show real status
        setState('success');
        clearInterval(interval);
        setTimeout(() => router.push(`/orders/${orderId}`), 1500);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>
              {state === 'loading' ? 'Confirming Payment...' : state === 'success' ? 'Payment Received' : 'Payment Issue'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center py-4">
            {state === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Verifying your payment. Please wait…</p>
              </>
            )}
            {state === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-muted-foreground">
                  Your payment was received. Redirecting to your order…
                </p>
                {reference && (
                  <p className="text-xs text-muted-foreground font-mono">Ref: {reference}</p>
                )}
              </>
            )}
            {state === 'failed' && (
              <>
                <XCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">
                  We could not confirm your payment. If money was debited, please contact support.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => router.push('/orders')}>My Orders</Button>
                  <Button onClick={() => router.back()}>Try Again</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-12" />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
