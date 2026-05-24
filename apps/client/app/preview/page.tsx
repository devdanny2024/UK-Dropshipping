'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Clock, ShoppingCart, Loader2, AlertTriangle, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { useCart } from '@/app/components/cart/use-cart';
import { useCurrency, US_TAX_RATE } from '@/app/hooks/use-currency';

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UK4', 'UK5', 'UK6', 'UK7', 'UK8', 'UK9', 'UK10', 'UK11', 'UK12', 'One Size'];
const COMMON_COLORS = ['Black', 'White', 'Navy', 'Grey', 'Red', 'Blue', 'Green', 'Pink', 'Brown', 'Beige', 'Other'];

function PreviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [productUrl, setProductUrl] = useState(() => params.get('url') ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<{
    snapshotId?: string;
    title: string;
    imageUrl?: string | null;
    price?: number | null;
    currency?: string | null;
    url: string;
    manual?: boolean;
  } | null>(null);
  const [manualPrice, setManualPrice] = useState<string>('');

  // Fallback / manual entry state (when crawler fails completely)
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualCreating, setManualCreating] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const { addItem } = useCart();
  const { formatAmount, toGBP } = useCurrency();

  const hasUrl = Boolean(params.get('url'));

  const store = useMemo(() => {
    const url = params.get('url') ?? '';
    try { return new URL(url).hostname; } catch { return 'unknown store'; }
  }, [params]);

  const product = useMemo(() => {
    const url = params.get('url') ?? 'https://example.com/product';
    const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
    const detectedPrice = resolved?.price ?? null;
    const effectivePrice = detectedPrice && detectedPrice > 0
      ? detectedPrice
      : (parseFloat(manualPrice) || null);
    const sourceCurrency = resolved?.currency ?? 'GBP';
    // US store: currency is USD (non-GBP from a non-UK domain)
    const isUSStore = sourceCurrency === 'USD';
    const usTax = (isUSStore && effectivePrice) ? effectivePrice * US_TAX_RATE : 0;
    return {
      name: resolved?.title ?? 'Product',
      price: effectivePrice,
      priceWithTax: effectivePrice ? effectivePrice + usTax : null,
      priceDetected: Boolean(detectedPrice && detectedPrice > 0),
      currency: sourceCurrency,
      isUSStore,
      usTax,
      image: resolved?.imageUrl ?? fallbackImage,
      store,
      url
    };
  }, [params, resolved, manualPrice, store]);

  const handleCreateManualSnapshot = async () => {
    const price = parseFloat(manualPrice);
    if (!manualTitle.trim()) {
      setManualError('Please enter a product name.');
      return;
    }
    if (!price || price <= 0) {
      setManualError('Please enter a valid price.');
      return;
    }
    const url = params.get('url');
    if (!url) {
      setManualError('No product URL found.');
      return;
    }

    setManualCreating(true);
    setManualError(null);
    try {
      const res = await fetch('/api/proxy/v1/manual-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title: manualTitle.trim(),
          price,
          currency: 'GBP',
          imageUrl: manualImageUrl.trim() || undefined
        })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        throw new Error(payload?.error?.message ?? 'Failed to create manual snapshot');
      }
      const data = payload.data;
      setResolved({
        snapshotId: data.id,
        title: data.title,
        imageUrl: data.imageUrl ?? null,
        price: data.price,
        currency: data.currency ?? 'GBP',
        url: data.url,
        manual: true
      });
      setError(null);
      setShowManualForm(false);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Failed to create manual snapshot');
    } finally {
      setManualCreating(false);
    }
  };

  useEffect(() => {
    const url = params.get('url');
    if (!url) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setShowManualForm(false);
    setResolved(null);

    fetch('/api/proxy/v1/resolve-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const message = payload?.error?.message ?? 'Unable to resolve product details.';
          throw new Error(message);
        }
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const data = payload?.data ?? payload;
        if (!data?.title) {
          throw new Error('Product details were incomplete. Please enter them manually below.');
        }
        setResolved({
          snapshotId: data.id,
          title: data.title,
          imageUrl: data.imageUrl ?? null,
          price: data.price ?? null,
          currency: data.currency ?? null,
          url: data.url ?? url
        });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          // Auto-show the manual form when the crawler fails
          setShowManualForm(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productUrl.trim()) return;
    router.push(`/preview?url=${encodeURIComponent(productUrl.trim())}`);
  };

  if (!hasUrl) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Paste a product link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
                <Input
                  placeholder="Paste a UK store product link"
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                />
                <Button type="submit">Create preview</Button>
              </form>
              <p className="text-sm text-muted-foreground">
                We&apos;ll fetch the product details, show a quote, and guide you through checkout.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Product image */}
          <div>
            <Card>
              <CardContent className="p-6">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
                  }}
                />
              </CardContent>
            </Card>

            {/* Manual entry fallback card — shown when crawler fails */}
            {(showManualForm || (error && !resolved)) && (
              <Card className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
                    <Edit2 className="h-4 w-4" />
                    Enter product details manually
                  </CardTitle>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Our crawler couldn&apos;t read this page. Fill in the details from the product page and we&apos;ll still create your quote.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-amber-800 dark:text-amber-300">Product name *</Label>
                    <Input
                      placeholder="e.g. Nike Air Max 270 UK9"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-amber-800 dark:text-amber-300">Price (GBP) *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">£</span>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="e.g. 109.99"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        className="w-36"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-amber-800 dark:text-amber-300">Image URL (optional)</Label>
                    <Input
                      placeholder="https://..."
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                    />
                  </div>
                  {manualError && (
                    <p className="text-sm text-destructive">{manualError}</p>
                  )}
                  <Button
                    className="w-full"
                    onClick={handleCreateManualSnapshot}
                    disabled={manualCreating}
                  >
                    {manualCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Use these details'
                    )}
                  </Button>
                  {!showManualForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-amber-700"
                      onClick={() => setShowManualForm(true)}
                    >
                      Enter details manually
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Product details + order form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{store}</Badge>
                  {resolved?.manual ? (
                    <Badge variant="secondary">Manual entry</Badge>
                  ) : resolved ? (
                    <Badge variant="default">Verified</Badge>
                  ) : null}
                </div>
                <CardTitle className="text-2xl">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resolving product details...
                  </div>
                )}
                {error && !resolved && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      {error} Please fill in the product details on the left to continue.
                    </span>
                  </div>
                )}

                {/* Price section */}
                <div className="space-y-2">
                  {product.priceDetected ? (
                    <>
                      <div className="text-3xl font-bold text-foreground">
                        {formatAmount(product.price, product.currency)}
                      </div>
                      {product.isUSStore && product.usTax > 0 && (
                        <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-3 py-2 text-sm space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Product price</span>
                            <span>{formatAmount(product.price, product.currency)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>US Sales Tax (est. 8%)</span>
                            <span>+ {formatAmount(product.usTax, product.currency)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-blue-200 dark:border-blue-800 pt-1 mt-1">
                            <span>Total incl. tax</span>
                            <span>{formatAmount(product.priceWithTax, product.currency)}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Price last checked at{' '}
                        {new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  ) : resolved ? (
                    // Crawler got snapshot but no price — allow manual price entry
                    <div className="space-y-2">
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        Price could not be auto-detected. Please enter the price from the product page.
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{product.currency}</span>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="e.g. 35.00"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(e.target.value)}
                          className="w-36"
                        />
                        {product.price && (
                          <span className="text-sm text-muted-foreground">
                            = {formatAmount(product.price, product.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Size / color / quantity selectors */}
                {resolved && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="size">Size</Label>
                      <Select value={size} onValueChange={setSize}>
                        <SelectTrigger id="size" className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_SIZES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
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
                          {COMMON_COLORS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
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
                            <SelectItem key={qty} value={qty.toString()}>{qty}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-4 space-y-3">
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    disabled={isLoading || !product.priceWithTax || !resolved?.snapshotId}
                    onClick={() => {
                      const taxInclusivePrice = product.priceWithTax ?? product.price ?? 0;
                      addItem({
                        name: product.name,
                        slug: undefined,
                        imageUrl: product.image,
                        // Normalise to GBP (handles USD products and US tax)
                        priceGBP: toGBP(taxInclusivePrice, product.currency),
                        quantity,
                        externalUrl: product.url,
                        productCode: undefined,
                        categoryName: store,
                        size,
                        color
                      });
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to cart
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => router.push('/shop')}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(product.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on {store}
                  </Button>

                  {/* Show "enter manually" button if still loading or if there's no resolved data yet */}
                  {!resolved && !isLoading && !showManualForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowManualForm(true)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Enter details manually instead
                    </Button>
                  )}
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

export default function ClientProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="rounded-lg border border-border p-8 text-muted-foreground">Loading preview...</div>
          </div>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
