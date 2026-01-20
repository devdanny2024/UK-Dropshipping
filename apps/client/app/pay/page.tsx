'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Lock, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';

export default function ClientPaymentPage() {
  const router = useRouter();
  const [method, setMethod] = useState('card');

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.push('/quote')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Quote
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={method} onValueChange={setMethod} className="space-y-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit or Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Bank Transfer
                </Label>
              </div>
            </RadioGroup>

            <Collapsible open={method === 'card'}>
              <CollapsibleTrigger className="sr-only">Card Details</CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <input
                      id="cardNumber"
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <input
                      id="cardName"
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Chioma Adeleke"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Expiry</Label>
                    <input
                      id="cardExpiry"
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCvc">CVC</Label>
                    <input
                      id="cardCvc"
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="123"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button className="w-full gap-2" size="lg" onClick={() => router.push('/orders')}>
              <Check className="h-4 w-4" />
              Complete Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

