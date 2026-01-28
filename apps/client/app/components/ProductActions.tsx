'use client';

import { ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useCart } from '@/app/components/cart/use-cart';

export function ProductActions({ product, imageUrl }: { product: any; imageUrl: string }) {
  const { addItem } = useCart();

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="gap-2"
        onClick={() =>
          addItem({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            imageUrl,
            priceGBP: product.priceGBP ?? undefined,
            quantity: 1,
            externalUrl: product.externalUrl ?? undefined,
            categoryName: product.category?.name
          })
        }
      >
        <ShoppingCart className="h-4 w-4" />
        Add to cart
      </Button>
      {product.externalUrl && (
        <Button asChild variant="outline" className="gap-2">
          <a href={product.externalUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            View retailer
          </a>
        </Button>
      )}
    </div>
  );
}
