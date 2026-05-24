import Link from 'next/link';
import { ExternalLink, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { PriceDisplay } from '@/app/components/PriceDisplay';
import { fetchJsonSafe } from '@/app/lib/server-api';

type Product = {
  id: string;
  name: string;
  slug: string;
  externalUrl?: string | null;
  category?: { name: string } | null;
  priceGBP?: number | null;
  images?: string[];
};

async function getProducts(): Promise<Product[]> {
  const payload = await fetchJsonSafe<any>('/api/products?limit=200');
  return payload?.data?.products ?? [];
}

export default async function ManualPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">Product Manual</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse all available products. Each listing shows the product name and a direct link to
            the UK retailer. We handle purchasing and delivery in two shipping legs.
          </p>
        </div>

        {/* Shipping stages explainer */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-5 flex gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Shipping Leg 1</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>UK Store → UK2ME Warehouse</strong><br />
                  We purchase your item from the UK retailer and receive it at our UK warehouse (2–5 business days).
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/20">
            <CardContent className="p-5 flex gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Shipping Leg 2</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>UK2ME Warehouse → Nigeria</strong><br />
                  We ship consolidated items from the UK to your door in Nigeria (7–14 business days).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product listing */}
        {products.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>No products listed yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-snug">{product.name}</CardTitle>
                    {product.category?.name && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">{product.category.name}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {product.priceGBP && (
                    <p className="text-sm font-medium text-foreground">
                      <PriceDisplay priceGBP={product.priceGBP} />
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Link
                      href={`/product/${product.slug}`}
                      className="inline-flex items-center gap-1 text-xs underline text-foreground hover:text-primary"
                    >
                      View on UK2ME
                    </Link>
                    {product.externalUrl && (
                      <a
                        href={product.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs underline text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                        UK Retailer
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center space-y-2">
          <p className="text-muted-foreground text-sm">
            Don&apos;t see what you&apos;re looking for?{' '}
            <Link href="/preview" className="underline text-foreground">
              Paste any UK product link
            </Link>{' '}
            and we&apos;ll get it for you.
          </p>
        </div>
      </div>
    </div>
  );
}
