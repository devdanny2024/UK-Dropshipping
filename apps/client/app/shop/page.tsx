import Link from 'next/link';
import { ProductCard } from '@/app/components/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

const backendBase = process.env.BACKEND_HTTP_BASE_URL ?? 'http://localhost:4000';

async function getCategories() {
  const res = await fetch(`${backendBase}/api/categories`, { cache: 'no-store' });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.data?.categories ?? [];
}

async function getFeatured() {
  const res = await fetch(`${backendBase}/api/products/featured`, { cache: 'no-store' });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.data?.products ?? [];
}

export default async function ShopPage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeatured()]);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-10">
        <section>
          <h1 className="text-3xl font-semibold">Shop</h1>
          <p className="text-muted-foreground mt-2">Explore categories and featured items.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Featured Products</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category: any) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Card className="h-full hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {category.description ?? 'View products'}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
