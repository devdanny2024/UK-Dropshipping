'use client';

import { useEffect, useState } from 'react';

const CURRENCIES = ['GBP', 'USD', 'NGN'] as const;
type Currency = typeof CURRENCIES[number];

type Rates = Partial<Record<Currency, number>>;

const SYMBOLS: Record<Currency, string> = { GBP: '£', USD: '$', NGN: '₦' };

let cachedRates: Rates = { GBP: 1 };
let ratePromise: Promise<Rates> | null = null;

function fetchRates(): Promise<Rates> {
  if (ratePromise) return ratePromise;
  ratePromise = fetch('/api/proxy/v1/fx?base=GBP&symbols=USD,NGN')
    .then((r) => r.json())
    .then((payload) => {
      if (payload?.ok && payload.data?.rates) {
        cachedRates = { GBP: 1, ...payload.data.rates };
      }
      return cachedRates;
    })
    .catch(() => cachedRates);
  return ratePromise;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [rates, setRates] = useState<Rates>({ GBP: 1 });

  useEffect(() => {
    const saved = localStorage.getItem('uk2me-display-currency') as Currency | null;
    if (saved && (CURRENCIES as readonly string[]).includes(saved)) setCurrency(saved);
    void fetchRates().then(setRates);

    const handler = (e: Event) => {
      const c = (e as CustomEvent<Currency>).detail;
      if ((CURRENCIES as readonly string[]).includes(c)) setCurrency(c);
    };
    window.addEventListener('uk2me-currency-change', handler);
    return () => window.removeEventListener('uk2me-currency-change', handler);
  }, []);

  const formatPrice = (priceGBP: number | null | undefined): string => {
    if (priceGBP == null) return '';
    const rate = rates[currency] ?? 1;
    const converted = priceGBP * rate;
    return `${SYMBOLS[currency]}${converted.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { currency, formatPrice };
}
