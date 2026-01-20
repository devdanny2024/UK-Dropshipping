'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

export default function ClientHomePage() {
  const router = useRouter();
  const [productUrl, setProductUrl] = useState('');

  const handleFetchProduct = () => {
    if (!productUrl.trim()) return;
    router.push(`/preview?url=${encodeURIComponent(productUrl)}`);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Start Your Order</CardTitle>
            <CardDescription>Paste a product link from any international store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://www.asos.com/product/..."
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  className="pl-10 h-11"
                  onKeyDown={(event) => event.key === 'Enter' && handleFetchProduct()}
                />
              </div>
              <Button onClick={handleFetchProduct} size="lg" className="gap-2">
                Fetch Product
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-secondary rounded-lg p-6 space-y-4">
              <h3 className="font-medium text-foreground">How It Works</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {[
                  'Paste a product link from ASOS, Zara, Amazon or any international store',
                  'Review the quote including item price, shipping, and all fees',
                  'We handle everything - purchase, UK delivery, international shipping, and customs',
                  'Track in real-time until delivery to your doorstep in Nigeria'
                ].map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <p>
                      <span className="font-medium text-foreground">{step.split(' ')[0]} </span>
                      {step.split(' ').slice(1).join(' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-border">
              <div>
                <div className="text-2xl font-semibold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Orders Delivered</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">24hrs</div>
                <div className="text-sm text-muted-foreground">Avg. Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

