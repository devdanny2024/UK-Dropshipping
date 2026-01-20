'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';

export default function ClientProductPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);

  const product = useMemo(() => {
    let url = params.get('url') ?? 'https://example.com/product';
    let store = 'example.com';
    try {
      store = new URL(url).hostname;
    } catch {
      url = 'https://example.com/product';
    }
    return {
      name: 'Sample Product',
      price: 99.99,
      currency: 'GBP',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      store,
      url
    };
  }, [params]);

  const handleGenerateQuote = () => {
    router.push('/quote');
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardContent className="p-6">
                <img src={product.image} alt={product.name} className="w-full h-auto rounded-lg" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{product.store}</Badge>
                  <Badge variant="default">In Stock</Badge>
                </div>
                <CardTitle className="text-2xl">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {product.currency} {product.price.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Price last checked at{' '}
                    {new Date().toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger id="size" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Select value={color} onValueChange={setColor}>
                      <SelectTrigger id="color" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Navy">Navy</SelectItem>
                        <SelectItem value="Grey">Grey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value, 10))}>
                      <SelectTrigger id="quantity" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((qty) => (
                          <SelectItem key={qty} value={qty.toString()}>
                            {qty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button onClick={handleGenerateQuote} className="w-full" size="lg">
                    Generate Quote
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(product.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on {product.store}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
              <CardContent className="p-4">
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-2">Price Protection</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    If the price changes between now and purchase, you will only pay the lower amount.
                    We will refund the difference if the price increases significantly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

