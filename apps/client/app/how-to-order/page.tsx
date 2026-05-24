import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

const STEPS = [
  {
    number: 1,
    title: 'Find a product on a UK store',
    description:
      'Browse any UK online retailer — ASOS, Amazon UK, Zara, Next, H&M and more. Copy the product page URL from your browser.',
    tip: 'Tip: Use our Shop page to browse pre-listed items, or paste any UK product link directly.'
  },
  {
    number: 2,
    title: 'Paste the link & choose your options',
    description:
      'Go to the Preview page and paste the product link. Our system fetches the product name, image, and price automatically. Select your size, colour, and quantity.',
    tip: 'If price detection fails, simply type the price shown on the retailer\'s website.'
  },
  {
    number: 3,
    title: 'Add to cart',
    description:
      'Click "Add to cart". You can add items from multiple UK stores in one order. Each item keeps its size and colour separate in the cart — no mix-ups.',
    tip: 'Added the wrong size? Remove the item from your cart and add it again with the correct option.'
  },
  {
    number: 4,
    title: 'Review your cart & check out',
    description:
      'Open your cart to review all items, sizes, colours, and prices. When ready, click "Proceed to Checkout" and enter your delivery address in Nigeria.',
    tip: 'You can add order notes for specific instructions (e.g. "gift wrap" or "black only, not navy").'
  },
  {
    number: 5,
    title: 'We purchase from the UK store',
    description:
      'After payment, our team purchases the items on your behalf from the UK retailer. The items are shipped to our UK2ME warehouse — this is Shipping Leg 1.',
    tip: 'You\'ll receive an email when items arrive at our UK warehouse.'
  },
  {
    number: 6,
    title: 'We ship to your door in Nigeria',
    description:
      'Once all your items are consolidated at our UK warehouse, we ship them to your Nigeria address — this is Shipping Leg 2. Full tracking is provided.',
    tip: 'Track both shipping legs in real time from My Account → Orders.'
  }
];

const SHIPPING_LEGS = [
  {
    leg: 'Leg 1',
    label: 'UK Store → UK2ME Warehouse',
    duration: '2–5 business days',
    description:
      'Once your order is confirmed and paid, we purchase the product from the UK retailer. The retailer ships to our warehouse in the UK.'
  },
  {
    leg: 'Leg 2',
    label: 'UK2ME Warehouse → Nigeria',
    duration: '7–14 business days',
    description:
      'We consolidate all your items and ship them from our UK warehouse to your delivery address in Nigeria, including customs clearance.'
  }
];

export default function HowToOrderPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">How to Place an Order</h1>
          <p className="text-muted-foreground text-lg">
            Shop any UK store in 6 simple steps and get it delivered to Nigeria.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-14">
          {STEPS.map((step) => (
            <Card key={step.number}>
              <CardContent className="p-6 flex gap-5">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {step.number}
                </div>
                <div className="space-y-2">
                  <h2 className="font-semibold text-base">{step.title}</h2>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-1.5">{step.tip}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Shipping legs explainer */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold mb-6 text-center">How Shipping Works</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {SHIPPING_LEGS.map((leg) => (
              <Card key={leg.leg} className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>{leg.leg}</Badge>
                    <span className="text-sm font-medium">{leg.duration}</span>
                  </div>
                  <h3 className="font-semibold">{leg.label}</h3>
                  <p className="text-sm text-muted-foreground">{leg.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Total estimated delivery time: <strong>2–3 weeks</strong> from order confirmation.
          </p>
        </div>

        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Ready to start shopping?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/shop">Browse Products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/preview">Paste a Product Link</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Have questions? Visit our{' '}
            <Link href="/faq" className="underline text-foreground">FAQ page</Link>{' '}
            or email{' '}
            <a href="mailto:support@uk2meonline.com" className="underline text-foreground">
              support@uk2meonline.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
