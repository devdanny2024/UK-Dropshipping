'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  productId?: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  priceGBP?: number;
  quantity: number;
  externalUrl?: string;
  productCode?: string;
  categoryName?: string;
};

type CartState = {
  items: CartItem[];
  currency: 'GBP';
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
      currency: 'GBP',
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((existingItem) => matchId(existingItem, item.productId ?? item.slug ?? item.externalUrl ?? ''));
          if (existing) {
            return {
              items: state.items.map((existingItem) =>
                matchId(existingItem, item.productId ?? item.slug ?? item.externalUrl ?? '')
                  ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
                  : existingItem
              )
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (slugOrId) =>
        set((state) => ({
          items: state.items.filter((item) => !matchId(item, slugOrId))
        })),
      updateQuantity: (slugOrId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            matchId(item, slugOrId) ? { ...item, quantity: Math.max(1, quantity) } : item
          )
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + (item.priceGBP ?? 0) * item.quantity, 0)
    }),
    { name: 'uk2me-cart' }
  )
);
