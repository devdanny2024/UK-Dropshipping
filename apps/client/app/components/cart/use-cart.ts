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
};

type CartState = {
  items: CartItem[];
  /** Currently active basket region. Items can only belong to this region. */
  region: Region;
  /** Currency of the active region (derived). */
  currency: 'GBP' | 'USD';
  setRegion: (region: Region) => void;
  /** Returns true if adding the item is allowed; false if it would mix regions. */
  canAddItem: (item: CartItem) => boolean;
  addItem: (item: CartItem) => void;
  removeItem: (slugOrId: string) => void;
  updateQuantity: (slugOrId: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

function matchId(item: CartItem, slugOrId: string) {
  return item.productId === slugOrId || item.slug === slugOrId || item.externalUrl === slugOrId;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      region: 'UK',
      currency: 'GBP',
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
          const existing = state.items.find((existingItem) =>
            matchId(existingItem, item.productId ?? item.slug ?? item.externalUrl ?? '')
          );
          if (existing) {
            return {
              region: targetRegion,
              currency: REGION_CURRENCY[targetRegion],
              items: state.items.map((existingItem) =>
                matchId(existingItem, item.productId ?? item.slug ?? item.externalUrl ?? '')
                  ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
                  : existingItem
              ),
            };
          }
          return {
            region: targetRegion,
            currency: REGION_CURRENCY[targetRegion],
            items: [...state.items, normalised],
          };
        }),
      removeItem: (slugOrId) =>
        set((state) => ({
          items: state.items.filter((item) => !matchId(item, slugOrId)),
        })),
      updateQuantity: (slugOrId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            matchId(item, slugOrId) ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + (item.priceGBP ?? 0) * item.quantity, 0),
    }),
    { name: 'uk2me-cart' }
  )
);
