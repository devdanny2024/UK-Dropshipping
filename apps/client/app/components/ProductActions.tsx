'use client';

import { ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useCart, type Region } from '@/app/components/cart/use-cart';

export function ProductActions({
  product,
  imageUrl,
  region,
}: {
  product: any;
  imageUrl: string;
  region?: Region;
}) {
  const { addItem, canAddItem, items } = useCart();

  // Region follows the product's native currency: USD → US/$, else UK/£.
  // An explicit region prop wins; products without a currency default to UK.
  const itemRegion: Region = region ?? (product.currency === 'USD' ? 'US' : 'UK');

  const item = {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    imageUrl,
    priceGBP: product.priceGBP ?? undefined,
    quantity: 1,
    externalUrl: product.externalUrl ?? undefined,
    categoryName: product.category?.name,
    region: itemRegion,
  };

  const blocked = items.length > 0 && !canAddItem(item);

  const handleAdd = () => {
    if (blocked) {
      const ok = window.confirm(
        `Your basket has ${items.length} item(s) from a different region. ` +
          'You can only buy from one region (UK or US) per basket. Clear it and start a new basket?'
      );
      if (!ok) return;
      useCart.getState().setRegion(itemRegion);
    }
    addItem(item);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button className="gap-2" onClick={handleAdd}>
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
