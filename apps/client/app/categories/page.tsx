import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

const backendBase = process.env.BACKEND_HTTP_BASE_URL ?? 'http://localhost:4000';

async function getCategories() {
  const res = await fetch(`${backendBase}/api/categories`, { cache: 'no-store' });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.data?.categories ?? [];
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Categories</h1>
          <p className="text-muted-foreground mt-2">Browse curated categories and shop faster.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: any) => (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <Card className="h-full hover:shadow-md transition">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {category.description ?? 'Explore products in this category.'}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
