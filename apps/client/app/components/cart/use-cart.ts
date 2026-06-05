'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Region = 'UK' | 'US';

export const REGION_CURRENCY: Record<Region, 'GBP' | 'USD'> = { UK: 'GBP', US: 'USD' };
export const REGION_FLAG: Record<Region, string> = { UK: '🇬🇧', US: '🇺🇸' };
export const REGION_SYMBOL: Record<Region, string> = { UK: '£', US: '$' };

export type CartItem = {
  productId?: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  // Generic unit price expressed in the item's region currency.
  // Kept as priceGBP for backward compatibility with existing pages.
  priceGBP?: number;
  quantity: number;
  externalUrl?: string;
  productCode?: string;
  categoryName?: string;
  region?: Region;
  size?: string;
  color?: string;
};

type CartState = {
  items: CartItem[];
  /** Currently active basket region. Items can only belong to this region. */
  region: Region;
  /** Currency of the active region (derived). */
  currency: 'GBP' | 'USD';
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  setRegion: (region: Region) => void;
  /** Returns true if adding the item is allowed; false if it would mix regions. */
  canAddItem: (item: CartItem) => boolean;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export function itemKey(item: CartItem): string {
  const base = item.productId ?? item.slug ?? item.externalUrl ?? item.name;
  const size = item.size ?? '';
  const color = item.color ?? '';
  return `${base}__${size}__${color}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      region: 'UK',
      currency: 'GBP',
      isOpen: false,
      setOpen: (open) => set({ isOpen: open }),
      setRegion: (region) =>
        set((state) => {
          if (region === state.region) return state;
          // Switching regions empties the basket — a basket cannot mix regions.
          return { region, currency: REGION_CURRENCY[region], items: [] };
        }),
      canAddItem: (item) => {
        const itemRegion = item.region ?? 'UK';
        const state = get();
        if (state.items.length === 0) return true;
        return itemRegion === state.region;
      },
      addItem: (item) =>
        set((state) => {
          const itemRegion = item.region ?? 'UK';
          // Refuse to mix regions: if the basket has items from another region, ignore.
          if (state.items.length > 0 && itemRegion !== state.region) {
            return state;
          }
          const normalised: CartItem = { ...item, region: itemRegion };
          const targetRegion = state.items.length === 0 ? itemRegion : state.region;
          const key = itemKey(normalised);
          const existing = state.items.find((existingItem) => itemKey(existingItem) === key);
          if (existing) {
            return {
              region: targetRegion,
              currency: REGION_CURRENCY[targetRegion],
              isOpen: true,
              items: state.items.map((existingItem) =>
                itemKey(existingItem) === key
                  ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
                  : existingItem
              ),
            };
          }
          return {
            region: targetRegion,
            currency: REGION_CURRENCY[targetRegion],
            isOpen: true,
            items: [...state.items, normalised],
          };
        }),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((item) => itemKey(item) !== key),
        })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            itemKey(item) === key ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + (item.priceGBP ?? 0) * item.quantity, 0),
    }),
    {
      name: 'uk2me-cart',
      partialize: (state) => ({ items: state.items, region: state.region, currency: state.currency })
    }
  )
);
