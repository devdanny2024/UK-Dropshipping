import { notFound } from 'next/navigation';
import { ProductCard } from '@/app/components/ProductCard';

const backendBase = process.env.BACKEND_HTTP_BASE_URL ?? 'http://localhost:4000';

async function getCategory(slug: string) {
  const res = await fetch(`${backendBase}/api/categories/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const payload = await res.json();
  return payload?.data?.category ?? null;
}

export default async function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug);
  if (!category) return notFound();

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">{category.name}</h1>
          {category.description && <p className="text-muted-foreground mt-2">{category.description}</p>}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {category.products?.map((product: any) => (
            <ProductCard key={product.id} product={{ ...product, category: { name: category.name } }} />
          ))}
        </div>
      </div>
    </div>
  );
}
