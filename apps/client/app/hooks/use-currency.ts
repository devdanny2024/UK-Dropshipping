'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CURRENCIES = ['GBP', 'USD', 'NGN'] as const;
export type Currency = typeof CURRENCIES[number];
type Rates = Partial<Record<Currency, number>>;

const SYMBOLS: Record<Currency, string> = { GBP: '£', USD: '$', NGN: '₦' };

type CurrencyState = {
  currency: Currency;
  rates: Rates;
  ratesLoaded: boolean;
  setCurrency: (c: Currency) => void;
  setRates: (r: Rates) => void;
  markRatesLoaded: () => void;
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'GBP',
      rates: { GBP: 1 },
      ratesLoaded: false,
      setCurrency: (currency) => set({ currency }),
      setRates: (rates) => set({ rates }),
      markRatesLoaded: () => set({ ratesLoaded: true }),
    }),
    {
      name: 'uk2me-currency',
      partialize: (s) => ({ currency: s.currency }),
    }
  )
);

export const US_TAX_RATE = 0.08;

export function useCurrency() {
  const currency = useCurrencyStore((s) => s.currency);
  const rates = useCurrencyStore((s) => s.rates);
  const ratesLoaded = useCurrencyStore((s) => s.ratesLoaded);
  const setRates = useCurrencyStore((s) => s.setRates);
  const markRatesLoaded = useCurrencyStore((s) => s.markRatesLoaded);

  useEffect(() => {
    if (ratesLoaded) return;
    fetch('/api/proxy/v1/fx?base=GBP&symbols=USD,NGN')
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.ok && payload.data?.rates) {
          setRates({ GBP: 1, ...payload.data.rates });
        }
        markRatesLoaded();
      })
      .catch(() => markRatesLoaded());
  }, [ratesLoaded, setRates, markRatesLoaded]);

  // Convert any amount in fromCurrency to GBP.
  // rates are GBP-based (1 GBP = X currency), so USD→GBP = amount / rates.USD.
  const toGBP = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'GBP') return amount;
    const rate = rates[fromCurrency as Currency];
    return rate ? amount / rate : amount;
  };

  // Format priceGBP in the user's selected display currency.
  const formatPrice = (priceGBP: number | null | undefined): string => {
    if (priceGBP == null) return '';
    const rate = rates[currency] ?? 1;
    const converted = priceGBP * rate;
    return `${SYMBOLS[currency]}${converted.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format any amount from any source currency, converting via GBP.
  const formatAmount = (amount: number | null | undefined, fromCurrency = 'GBP'): string => {
    if (amount == null) return '';
    return formatPrice(toGBP(amount, fromCurrency));
  };

  return { currency, rates, formatPrice, formatAmount, toGBP };
}
