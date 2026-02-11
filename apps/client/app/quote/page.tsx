'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';

export default function ClientQuotePage() {
  const router = useRouter();
  const [rates, setRates] = useState<{ USD?: number; NGN?: number }>({});

  const breakdown = {
    total: 197.69,
    currency: 'GBP'
  };

  useEffect(() => {
    fetch('/api/proxy/v1/fx?base=GBP&symbols=USD,NGN')
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok) setRates(payload.data.rates ?? {});
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.push('/preview')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Quote Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{breakdown.currency} {breakdown.total.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-1">
              <div>USD: {rates.USD ? (breakdown.total * rates.USD).toFixed(2) : '—'}</div>
              <div>NGN: {rates.NGN ? (breakdown.total * rates.NGN).toFixed(2) : '—'}</div>
            </div>
            <Button className="w-full gap-2" size="lg" onClick={() => router.push('/pay')}>
              <CreditCard className="h-4 w-4" />
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
