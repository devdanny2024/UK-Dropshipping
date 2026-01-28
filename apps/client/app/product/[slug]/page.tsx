import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ProductActions } from '@/app/components/ProductActions';

const backendBase = process.env.BACKEND_HTTP_BASE_URL ?? 'http://localhost:4000';

async function getProduct(slug: string) {
  const res = await fetch(`${backendBase}/api/products/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const payload = await res.json();
  return payload?.data?.product ?? null;
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) return notFound();

  const imageUrl = product.images?.[0] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent className="p-6">
              <img src={imageUrl} alt={product.name} className="w-full rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.category?.name}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
              <div className="text-2xl font-semibold">
                {product.priceGBP ? `GBP ${Number(product.priceGBP).toFixed(2)}` : 'Request quote'}
              </div>
              <ProductActions product={product} imageUrl={imageUrl} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
