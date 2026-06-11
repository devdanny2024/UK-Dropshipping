'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Clock, ShoppingCart, Loader2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { useCart, type Region } from '@/app/components/cart/use-cart';
import { useCurrency, US_TAX_RATE } from '@/app/hooks/use-currency';

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UK4', 'UK5', 'UK6', 'UK7', 'UK8', 'UK9', 'UK10', 'UK11', 'UK12', 'One Size', 'Other'];
const COMMON_COLORS = ['Black', 'White', 'Navy', 'Grey', 'Red', 'Blue', 'Green', 'Pink', 'Brown', 'Beige', 'Other'];
const COMMON_CATEGORIES = ['Clothing', 'Shoes', 'Accessories', 'Electronics', 'Home & Garden', 'Beauty', 'Sports', 'Toys', 'Books', 'Other'];

function PreviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [customSize, setCustomSize] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productUrl, setProductUrl] = useState(() => params.get('url') ?? '');
  const [isLoading, setIsLoading] = useState(false);
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

  // Manual entry state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProductLink, setManualProductLink] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('Clothing');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualCreating, setManualCreating] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const { addItem } = useCart();
  const { formatAmount } = useCurrency();

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
    if (!manualTitle.trim()) { setManualError('Please enter a product name.'); return; }
    if (!price || price <= 0) { setManualError('Please enter a valid price.'); return; }

    const url = manualProductLink.trim() || params.get('url');
    if (!url) { setManualError('Please enter a product link.'); return; }

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
          imageUrl: manualImageUrl.trim() || undefined,
          categoryName: manualCategory,
        })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        throw new Error(payload?.error?.message ?? 'Failed to create snapshot');
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
      setShowManualForm(false);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Failed to create snapshot');
    } finally {
      setManualCreating(false);
    }
  };

  // Let the customer correct auto-fetched details that are wrong (name, price,
  // image) by reopening the manual form pre-filled with what we resolved.
  const startEditDetails = () => {
    setManualTitle(resolved?.title ?? '');
    setManualPrice(resolved?.price != null ? String(resolved.price) : manualPrice);
    setManualImageUrl(resolved?.imageUrl ?? '');
    setManualProductLink(resolved?.url ?? params.get('url') ?? '');
    setManualError(null);
    setResolved(null);
    setShowManualForm(true);
  };

  useEffect(() => {
    const url = params.get('url');
    if (!url) return;

    // Pre-fill the manual product link field with the URL
    setManualProductLink(url);

    let cancelled = false;
    setIsLoading(true);
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
          const message = payload?.error?.message ?? 'Unable to fetch product.';
          throw new Error(message);
        }
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const data = payload?.data ?? payload;
        if (!data?.title) throw new Error('Incomplete product data');
        setResolved({
          snapshotId: data.id,
          title: data.title,
          imageUrl: data.imageUrl ?? null,
          price: data.price ?? null,
          currency: data.currency ?? null,
          url: data.url ?? url
        });
      })
      .catch(() => {
        if (!cancelled) setShowManualForm(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [params]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productUrl.trim()) return;
    router.push(`/preview?url=${encodeURIComponent(productUrl.trim())}`);
  };

  // ── No URL yet: show link-paste screen ───────────────────────────────────
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

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Fetching product details…</p>
        </div>
      </div>
    );
  }

  // ── Manual entry form (shown when crawler fails) ──────────────────────────
  if (showManualForm && !resolved) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Enter Product Details
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fill in the details from the product page to continue with your order.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Product Link */}
              <div className="space-y-1.5">
                <Label htmlFor="m-url">Product Link <span className="text-destructive">*</span></Label>
                <Input
                  id="m-url"
                  placeholder="https://www.marksandspencer.com/..."
                  value={manualProductLink}
                  onChange={(e) => setManualProductLink(e.target.value)}
                />
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <Label htmlFor="m-title">Product Name <span className="text-destructive">*</span></Label>
                <Input
                  id="m-title"
                  placeholder="e.g. M&S Slim Fit Chinos"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <Label htmlFor="m-price">Price (£ GBP) <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">£</span>
                  <Input
                    id="m-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Size + Color in a row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-size">Size</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger id="m-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {size === 'Other' && (
                    <Input
                      className="mt-2"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      placeholder="Type the exact size"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-color">Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger id="m-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_COLORS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {color === 'Other' && (
                    <Input
                      className="mt-2"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="Type the colour"
                    />
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="m-category">Category</Label>
                <Select value={manualCategory} onValueChange={setManualCategory}>
                  <SelectTrigger id="m-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image URL (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="m-image">Product Image URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="m-image"
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
                size="lg"
                onClick={handleCreateManualSnapshot}
                disabled={manualCreating}
              >
                {manualCreating
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding product…</>
                  : 'Continue to order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Normal product view ───────────────────────────────────────────────────
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
                      <p className="text-sm text-muted-foreground">
                        Price not detected. Please enter it from the product page.
                      </p>
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

                {/* Correct wrong auto-fetched details */}
                {resolved && (
                  <button
                    type="button"
                    onClick={startEditDetails}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Details wrong? Edit name, price or image
                  </button>
                )}

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
                      {size === 'Other' && (
                        <Input
                          className="mt-2"
                          value={customSize}
                          onChange={(e) => setCustomSize(e.target.value)}
                          placeholder="Type the exact size"
                        />
                      )}
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
                      {color === 'Other' && (
                        <Input
                          className="mt-2"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          placeholder="Type the colour"
                        />
                      )}
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
                      const finalSize = size === 'Other' ? (customSize.trim() || 'Other') : size;
                      const finalColor = color === 'Other' ? (customColor.trim() || 'Other') : color;
                      // Region follows the product's own currency: USD → US/$ basket,
                      // everything else → UK/£. Store the NATIVE region-currency price
                      // (no GBP conversion) — priceGBP holds the basket's native price.
                      const region: Region = product.currency === 'USD' ? 'US' : 'UK';
                      addItem({
                        name: product.name,
                        slug: undefined,
                        imageUrl: product.image,
                        priceGBP: taxInclusivePrice,
                        quantity,
                        externalUrl: product.url,
                        productCode: undefined,
                        categoryName: manualCategory || store,
                        region,
                        size: finalSize,
                        color: finalColor
                      });
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to cart
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => router.back()}
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading preview…</p>
          </div>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
