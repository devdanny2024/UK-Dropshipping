'use client';

import Link from 'next/link';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart, itemKey } from '@/app/components/cart/use-cart';
import { useCurrency } from '@/app/hooks/use-currency';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';

export function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, subtotal } = useCart();
  const { formatPrice } = useCurrency();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.map((item) => {
                const key = itemKey(item);
                return (
                  <div key={key} className="flex gap-3 rounded-lg border border-border p-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 rounded-md object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug line-clamp-2">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          aria-label="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.size && <Badge variant="outline" className="text-[10px]">Size: {item.size}</Badge>}
                        {item.color && <Badge variant="outline" className="text-[10px]">Colour: {item.color}</Badge>}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Qty {item.quantity}</span>
                        <span className="font-semibold">{formatPrice(item.priceGBP ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border px-4 py-4 space-y-3">
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal())}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping & fees calculated at checkout</p>
              <Button asChild className="w-full" onClick={() => setOpen(false)}>
                <Link href="/cart">View cart &amp; checkout</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  const last = items[items.length - 1];
                  if (last?.externalUrl) {
                    window.location.href = `/preview?url=${encodeURIComponent(last.externalUrl)}`;
                  }
                }}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
