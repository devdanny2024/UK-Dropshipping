import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Truck, Globe, Clock, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ProductCard } from '@/app/components/ProductCard';

const backendBase = process.env.BACKEND_HTTP_BASE_URL ?? 'http://localhost:4000';

async function getFeatured() {
  const res = await fetch(`${backendBase}/api/products/featured`, { cache: 'no-store' });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.data?.products ?? [];
}

export default async function ClientHomePage() {
  const featured = await getFeatured();
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit">New: UK2ME powered</Badge>
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground leading-tight">
              Shop UK stores from anywhere. We handle the hard parts.
            </h1>
            <p className="text-lg text-muted-foreground">
              Uk2meonline turns any UK product link into a seamless, tracked delivery. Transparent pricing,
              automated purchase, and live updates from checkout to doorstep.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/preview">
                  Paste a product link
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/orders">Track an order</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Secure payments
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                24-48hr UK processing
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                UK to NG delivery network
              </div>
            </div>
          </div>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Instant quote preview</CardTitle>
              <CardDescription>See the full landed cost before you pay.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Item price</span>
                <span className="font-medium">GBP 129.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">UK delivery</span>
                <span className="font-medium">GBP 0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">International shipping</span>
                <span className="font-medium">GBP 45.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service fee</span>
                <span className="font-medium">GBP 12.00</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">GBP 186.00</span>
              </div>
              <Button asChild className="w-full">
                <Link href="/quote">See full quote</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Automated purchase',
              description: 'We buy from UK stores fast with our adapter network.',
              icon: Sparkles
            },
            {
              title: 'UK warehouse handling',
              description: 'Receive, inspect, and consolidate before international shipping.',
              icon: Truck
            },
            {
              title: 'Live tracking',
              description: 'Milestone updates from payment to delivery in Nigeria.',
              icon: Globe
            }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Featured Products</h2>
            <Button asChild variant="outline">
              <Link href="/shop">View all</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] items-start">
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Four steps to your doorstep.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                'Paste a product link from any UK store.',
                'Review your quote with a single total.',
                'We purchase, receive, and ship from the UK.',
                'Track delivery in real time until it arrives.'
              ].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: 'Orders delivered', value: '1,200+' },
              { label: 'Average UK processing', value: '24 hrs' },
              { label: 'Success rate', value: '98%' },
              { label: 'Partner stores', value: '50+' }
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="text-3xl font-semibold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <Card className="bg-secondary/60">
          <CardContent className="py-12 px-6 md:px-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Star className="h-4 w-4" />
                Trusted by daily shoppers
              </div>
              <h2 className="text-3xl font-semibold">Ready to ship your first UK order?</h2>
              <p className="text-muted-foreground mt-2">
                Create an account to save addresses, track orders, and get faster quotes.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Create account</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

