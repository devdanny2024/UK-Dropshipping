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
  size?: string;
  color?: string;
};

type CartState = {
  items: CartItem[];
  currency: 'GBP';
  isOpen: boolean;
  setOpen: (open: boolean) => void;
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
      currency: 'GBP',
      isOpen: false,
      setOpen: (open) => set({ isOpen: open }),
      addItem: (item) =>
        set((state) => {
          const key = itemKey(item);
          const existing = state.items.find((existingItem) => itemKey(existingItem) === key);
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((existingItem) =>
                itemKey(existingItem) === key
                  ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
                  : existingItem
              )
            };
          }
          return { isOpen: true, items: [...state.items, item] };
        }),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((item) => itemKey(item) !== key)
        })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            itemKey(item) === key ? { ...item, quantity: Math.max(1, quantity) } : item
          )
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + (item.priceGBP ?? 0) * item.quantity, 0)
    }),
    {
      name: 'uk2me-cart',
      partialize: (state) => ({ items: state.items, currency: state.currency })
    }
  )
);
