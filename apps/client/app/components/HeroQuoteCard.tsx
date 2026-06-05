'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useCurrency } from '@/app/hooks/use-currency';

const EXAMPLE_LINES: [string, number][] = [
  ['Item price', 109.99],
  ['UK delivery', 0],
  ['International shipping', 38],
  ['Service fee', 11],
  ['Duties buffer', 8.5],
];
const EXAMPLE_TOTAL = EXAMPLE_LINES.reduce((sum, [, v]) => sum + v, 0);

export function HeroQuoteCard() {
  const { formatPrice, rates } = useCurrency();
  const ngnTotal = rates.NGN ? Math.round(EXAMPLE_TOTAL * rates.NGN) : 264280;

  return (
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
        {EXAMPLE_LINES.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{formatPrice(value)}</span>
          </div>
        ))}
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-base">Total</span>
          <div className="text-right">
            <div className="font-bold text-lg">{formatPrice(EXAMPLE_TOTAL)}</div>
            <div className="text-xs text-muted-foreground">≈ ₦{ngnTotal.toLocaleString('en-NG')}</div>
          </div>
        </div>
        <Button asChild className="w-full gap-2" style={{ background: 'var(--brand-violet)' }}>
          <Link href="/preview">Get your quote <ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">No hidden fees · FX rate locked at checkout</p>
      </CardContent>
    </Card>
  );
}
