'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

function PaymentCallbackContent() {
  const params = useSearchParams();
  const status = params.get('status') ?? 'pending';
  const txRef = params.get('tx_ref') ?? '';

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Payment {status === 'successful' ? 'Successful' : 'Status'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Transaction reference: {txRef || 'N/A'}</p>
            <Button asChild className="w-full"><Link href="/orders">Go to my orders</Link></Button>
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
