'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useCart } from '@/app/components/cart/use-cart';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    images?: string[] | null;
    externalUrl?: string | null;
    priceGBP?: number | null;
    currency?: string | null;
    category?: { name: string };
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const imageUrl = product.images?.[0] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          {product.category?.name && <Badge variant="secondary">{product.category.name}</Badge>}
          {product.priceGBP ? (
            <span className="text-sm font-semibold">
              {product.currency ?? 'GBP'} {Number(product.priceGBP).toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Request quote</span>
          )}
        </div>
        <CardTitle className="text-base">{product.name}</CardTitle>
        <div className="mt-auto flex gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/product/${product.slug}`}>View</Link>
          </Button>
          <Button
            className="w-full gap-2"
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
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
