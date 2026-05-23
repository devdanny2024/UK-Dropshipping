import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Truck, Globe, Clock, Star, Package, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ProductCard } from '@/app/components/ProductCard';
import { fetchJsonSafe } from '@/app/lib/server-api';

const FALLBACK_PRODUCTS = [
  {
    id: 'f1', name: 'Nike Air Max 270', slug: 'nike-air-max-270',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&fit=crop'],
    priceGBP: 109.99, currency: 'GBP', category: { name: 'Sneakers' }
  },
  {
    id: 'f2', name: 'Topshop Oversized Blazer', slug: 'topshop-blazer',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80&fit=crop'],
    priceGBP: 75.00, currency: 'GBP', category: { name: 'Fashion' }
  },
  {
    id: 'f3', name: 'Sony WH-1000XM5 Headphones', slug: 'sony-wh1000xm5',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop'],
    priceGBP: 279.00, currency: 'GBP', category: { name: 'Electronics' }
  },
  {
    id: 'f4', name: 'The Ordinary Skincare Set', slug: 'ordinary-skincare-set',
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80&fit=crop'],
    priceGBP: 42.50, currency: 'GBP', category: { name: 'Beauty' }
  },
  {
    id: 'f5', name: 'ASOS Floral Midi Dress', slug: 'asos-floral-midi',
    images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80&fit=crop'],
    priceGBP: 48.00, currency: 'GBP', category: { name: 'Fashion' }
  },
  {
    id: 'f6', name: 'Mulberry Mini Alexa Bag', slug: 'mulberry-alexa-mini',
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&fit=crop'],
    priceGBP: 395.00, currency: 'GBP', category: { name: 'Accessories' }
  },
];

const STATIC_CATEGORIES = [
  { id: 'c1', name: 'Fashion', slug: 'fashion', imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80&fit=crop', productCount: null },
  { id: 'c2', name: 'Sneakers', slug: 'sneakers', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop', productCount: null },
  { id: 'c3', name: 'Electronics', slug: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80&fit=crop', productCount: null },
  { id: 'c4', name: 'Beauty', slug: 'beauty', imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80&fit=crop', productCount: null },
  { id: 'c5', name: 'Home & Living', slug: 'home', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop', productCount: null },
  { id: 'c6', name: 'Accessories', slug: 'accessories', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop', productCount: null },
];

const TESTIMONIALS = [
  { name: 'Chioma A.', location: 'Lagos', text: 'Got my ASOS order in 12 days. The tracking was spot on and the customer service was brilliant. UK2ME is the real deal!', rating: 5, avatar: 'CA' },
  { name: 'Emeka O.', location: 'Abuja', text: 'Ordered a pair of Nike trainers for my son. Price was transparent, no hidden fees. Will definitely order again.', rating: 5, avatar: 'EO' },
  { name: 'Titi M.', location: 'Port Harcourt', text: 'Ordered skincare from Boots and it arrived perfectly packaged. The quote tool made it so easy to know the total cost upfront.', rating: 5, avatar: 'TM' },
];

async function getFeatured() {
  const payload = await fetchJsonSafe<any>('/api/products/featured');
  return payload?.data?.products?.length ? payload.data.products : FALLBACK_PRODUCTS;
}

async function getCategories() {
  const payload = await fetchJsonSafe<any>('/api/categories');
  return payload?.data?.categories?.length ? payload.data.categories : STATIC_CATEGORIES;
}

export default async function ClientHomePage() {
  const [featured, categories] = await Promise.all([getFeatured(), getCategories()]);

  return (
    <div className="min-h-screen bg-background">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=85&fit=crop"
            alt="UK Shopping"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,10,26,0.88) 0%, rgba(92,33,182,0.75) 50%, rgba(13,10,26,0.65) 100%)' }} />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-7">
              <div className="flex items-center gap-2">
                <Badge className="gap-1.5 px-3 py-1" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)' }}>
                  <Zap className="h-3 w-3" />
                  Trusted by 1,200+ Nigerian shoppers
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Shop UK stores.{' '}
                <span style={{ color: '#F59E0B' }}>Delivered</span>{' '}
                to your door.
              </h1>
              <p className="text-lg text-white/75 max-w-lg leading-relaxed">
                Paste any UK product link — ASOS, Nike, Boots, Amazon UK — and we handle the purchase, UK warehouse, international shipping, and last-mile delivery in Nigeria.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2 text-base px-6" style={{ background: '#F59E0B', color: '#0D0A1A' }}>
                  <Link href="/preview">
                    Paste a product link
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 text-base px-6 border-white/30 text-white hover:bg-white/10">
                  <Link href="/shop">Browse products</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-white/60">
                {[
                  [ShieldCheck, 'Secure payments'],
                  [Clock, '24–48hr UK processing'],
                  [Globe, 'UK → Nigeria delivery'],
                ].map(([Icon, label]: any) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-white/40" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Quote card */}
            <Card className="shadow-2xl border-white/10 bg-white/95 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--brand-violet)' }}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Instant Quote Preview
                </div>
                <CardTitle className="text-xl">Nike Air Max 270 — UK</CardTitle>
                <CardDescription>Full landed cost to Lagos, Nigeria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Item price', 'GBP 109.99'],
                  ['UK delivery', 'GBP 0.00'],
                  ['International shipping', 'GBP 38.00'],
                  ['Service fee', 'GBP 11.00'],
                  ['Duties buffer', 'GBP 8.50'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base">Total</span>
                  <div className="text-right">
                    <div className="font-bold text-lg">GBP 167.49</div>
                    <div className="text-xs text-muted-foreground">≈ ₦264,280</div>
                  </div>
                </div>
                <Button asChild className="w-full gap-2" style={{ background: 'var(--brand-violet)' }}>
                  <Link href="/preview">Get your quote <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">No hidden fees · FX rate locked at checkout</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="border-y border-border bg-card">
        <div className="container mx-auto px-4 py-5">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Shop from UK&apos;s top brands</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { name: 'ASOS', domain: 'asos.com' },
              { name: 'Nike', domain: 'nike.com' },
              { name: 'Boots', domain: 'boots.com' },
              { name: 'Amazon UK', domain: 'amazon.co.uk' },
              { name: 'Zara', domain: 'zara.com' },
              { name: 'Next', domain: 'next.co.uk' },
              { name: 'H&M', domain: 'hm.com' },
              { name: 'Argos', domain: 'argos.co.uk' },
            ].map(({ name, domain }) => (
              <div key={name} className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                <img
                  src={`https://www.google.com/s2/favicons?sz=128&domain=${domain}`}
                  alt={name}
                  className="h-8 w-8 rounded object-contain"
                />
                <span className="text-[10px] font-medium text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="secondary" className="px-3 py-1">Simple 4-step process</Badge>
          <h2 className="text-3xl font-bold">How UK2ME works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">From any UK product page to your door in Nigeria — fully tracked, no surprises.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { step: 1, icon: Globe, title: 'Paste a link', desc: 'Copy any product URL from ASOS, Nike, Boots, Amazon UK, or 50+ other UK stores.', color: '#7C3AED' },
            { step: 2, icon: Sparkles, title: 'Get a quote', desc: 'See the full landed cost — item price, shipping, service fee, duties — before you pay anything.', color: '#F59E0B' },
            { step: 3, icon: Truck, title: 'We handle it', desc: 'We purchase from the UK store, receive at our warehouse, and ship internationally.', color: '#10b981' },
            { step: 4, icon: CheckCircle, title: 'Delivered', desc: 'Your order arrives at your door in Nigeria with real-time tracking the whole way.', color: '#3b82f6' },
          ].map((item) => (
            <div key={item.step} className="card-hover relative">
              <Card className="h-full text-center border-border">
                <CardContent className="pt-8 pb-6 px-5 space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: `${item.color}18` }}>
                    <item.icon className="h-6 w-6" style={{ color: item.color }} />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: item.color }}>Step {item.step}</div>
                  <h3 className="font-bold text-base">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Shop by category</h2>
            <p className="text-muted-foreground mt-1">Thousands of products from the UK's best stores</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex gap-2">
            <Link href="/shop">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((cat: any) => (
            <Link key={cat.id ?? cat.slug} href={`/category/${cat.slug}`} className="group card-hover">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full brand-gradient" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="font-bold text-sm">{cat.name}</div>
                  {cat.productCount != null && (
                    <div className="text-[11px] text-white/70">{cat.productCount} items</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured products</h2>
            <p className="text-muted-foreground mt-1">Popular items from UK stores, ready to order</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex gap-2">
            <Link href="/shop">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/shop">View all products <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4 py-14">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            {[
              { value: '1,200+', label: 'Orders delivered', icon: Package },
              { value: '24 hrs', label: 'Avg UK processing', icon: Clock },
              { value: '98%', label: 'Success rate', icon: CheckCircle },
              { value: '50+', label: 'Partner UK stores', icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <stat.icon className="h-6 w-6 mx-auto" style={{ color: 'var(--brand-violet)' }} />
                <div className="text-4xl font-bold" style={{ color: 'var(--brand-violet)' }}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="secondary" className="px-3 py-1">Customer reviews</Badge>
          <h2 className="text-3xl font-bold">What our customers say</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="card-hover">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white brand-gradient">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.location}, Nigeria</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative rounded-3xl overflow-hidden brand-gradient p-10 md:p-16">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-white/70 text-sm">Trusted by daily shoppers</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">Ready to shop the UK?</h2>
              <p className="text-white/70 mt-2 text-lg">Create an account and get your first order started in minutes.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-semibold gap-2">
                <Link href="/signup">Create free account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/preview">Try a quote first</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
