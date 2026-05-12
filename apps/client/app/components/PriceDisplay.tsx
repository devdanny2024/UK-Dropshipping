'use client';

import { useCurrency } from '@/app/hooks/use-currency';

export function PriceDisplay({ priceGBP, className }: { priceGBP?: number | null; className?: string }) {
  const { formatPrice } = useCurrency();
  if (!priceGBP) return <span className="text-muted-foreground text-sm italic">Request quote</span>;
  return <span className={className}>{formatPrice(priceGBP)}</span>;
}
