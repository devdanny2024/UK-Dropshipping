import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { ProductCard } from '@/app/components/ProductCard';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { fetchJsonSafe } from '@/app/lib/server-api';

const STATIC_CATEGORIES = [
  { id: 'c1', name: 'Fashion', slug: 'fashion', description: 'Clothing, dresses, suits & more from ASOS, Zara, H&M', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80&fit=crop' },
  { id: 'c2', name: 'Sneakers', slug: 'sneakers', description: 'Nike, Adidas, New Balance, Converse & more', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop' },
  { id: 'c3', name: 'Electronics', slug: 'electronics', description: 'Headphones, gadgets, phones & accessories', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80&fit=crop' },
  { id: 'c4', name: 'Beauty', slug: 'beauty', description: 'Skincare, makeup, haircare & fragrances', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80&fit=crop' },
  { id: 'c5', name: 'Home & Living', slug: 'home', description: 'Furniture, décor, kitchen & bedding', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop' },
  { id: 'c6', name: 'Accessories', slug: 'accessories', description: 'Watches, bags, jewellery & sunglasses', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop' },
];

const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Nike Air Max 270', slug: 'nike-air-max-270', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&fit=crop'], priceGBP: 109.99, currency: 'GBP', category: { name: 'Sneakers' } },
  { id: 'p2', name: 'ASOS Oversized Blazer', slug: 'asos-blazer', images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80&fit=crop'], priceGBP: 72.00, currency: 'GBP', category: { name: 'Fashion' } },
  { id: 'p3', name: 'Sony WH-1000XM5', slug: 'sony-wh1000xm5', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop'], priceGBP: 279.00, currency: 'GBP', category: { name: 'Electronics' } },
  { id: 'p4', name: 'The Ordinary Skincare Set', slug: 'ordinary-skincare', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80&fit=crop'], priceGBP: 42.50, currency: 'GBP', category: { name: 'Beauty' } },
  { id: 'p5', name: 'Adidas Ultraboost 22', slug: 'adidas-ultraboost', images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80&fit=crop'], priceGBP: 139.99, currency: 'GBP', category: { name: 'Sneakers' } },
  { id: 'p6', name: 'ASOS Floral Midi Dress', slug: 'asos-floral-midi', images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80&fit=crop'], priceGBP: 48.00, currency: 'GBP', category: { name: 'Fashion' } },
  { id: 'p7', name: 'Apple AirPods Pro', slug: 'apple-airpods-pro', images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80&fit=crop'], priceGBP: 229.00, currency: 'GBP', category: { name: 'Electronics' } },
  { id: 'p8', name: 'Mulberry Mini Alexa Bag', slug: 'mulberry-alexa', images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&fit=crop'], priceGBP: 395.00, currency: 'GBP', category: { name: 'Accessories' } },
  { id: 'p9', name: 'Charlotte Tilbury Pillow Talk', slug: 'charlotte-tilbury-pillow-talk', images: ['https://images.unsplash.com/photo-1586495777744-4e6232bf2805?w=800&q=80&fit=crop'], priceGBP: 28.00, currency: 'GBP', category: { name: 'Beauty' } },
];

async function getCategories() {
  const payload = await fetchJsonSafe<any>('/api/categories');
  return payload?.data?.categories?.length ? payload.data.categories : STATIC_CATEGORIES;
}

async function getFeatured() {
  const payload = await fetchJsonSafe<any>('/api/products/featured');
  return payload?.data?.products?.length ? payload.data.products : FALLBACK_PRODUCTS;
}

export default async function ShopPage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeatured()]);

  return (
    <div className="min-h-screen bg-background">
      {/* Shop Hero */}
      <div className="relative overflow-hidden brand-gradient">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3" />
        </div>
        <div className="relative container mx-auto px-4 py-14 text-center text-white">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">UK2ME Shop</Badge>
          <h1 className="text-4xl font-bold mb-3">Browse UK Products</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
            Explore thousands of products from the UK's best stores — delivered to Nigeria.
          </p>
          <div className="flex max-w-md mx-auto bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3 gap-3 items-center">
            <Search className="h-4 w-4 text-white/50 shrink-0" />
            <span className="text-white/50 text-sm">Search products or paste a URL…</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-12 space-y-14">

        {/* Categories */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Shop by Category</h2>
              <p className="text-muted-foreground text-sm mt-1">Find exactly what you're looking for</p>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat: any) => (
              <Link key={cat.id ?? cat.slug} href={`/category/${cat.slug}`} className="group card-hover">
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full brand-gradient" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="font-bold text-sm">{cat.name}</div>
                    {cat.description && <div className="text-[10px] text-white/65 line-clamp-1 mt-0.5">{cat.description}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground text-sm mt-1">Popular items ready to order from the UK</p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex gap-2">
              <Link href="/preview">Paste your own link <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Paste your link CTA */}
        <section className="rounded-2xl border border-border bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">Can't find what you need?</h3>
            <p className="text-muted-foreground mt-1">Paste any UK product URL and we'll give you an instant quote.</p>
          </div>
          <Button asChild size="lg" className="shrink-0 gap-2" style={{ background: 'var(--brand-violet)' }}>
            <Link href="/preview">Paste a product link <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
