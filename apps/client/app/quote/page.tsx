'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';

export default function ClientQuotePage() {
  const router = useRouter();

  const breakdown = {
    itemPrice: 99.99,
    serviceFee: 15.0,
    ukDelivery: 0.0,
    internationalShipping: 45.0,
    dutiesBuffer: 25.0,
    fxConversion: 8.5,
    paymentFee: 4.2,
    total: 197.69,
    currency: 'GBP'
  };

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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Price</span>
                <span className="font-medium">{breakdown.currency} {breakdown.itemPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-medium">{breakdown.currency} {breakdown.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UK Delivery</span>
                <span className="font-medium">{breakdown.ukDelivery === 0 ? 'Free' : breakdown.ukDelivery.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">International Shipping</span>
                <span className="font-medium">{breakdown.currency} {breakdown.internationalShipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duties Buffer</span>
                <span className="font-medium">{breakdown.currency} {breakdown.dutiesBuffer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FX Conversion</span>
                <span className="font-medium">{breakdown.currency} {breakdown.fxConversion.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Fee</span>
                <span className="font-medium">{breakdown.currency} {breakdown.paymentFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{breakdown.currency} {breakdown.total.toFixed(2)}</span>
              </div>
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

