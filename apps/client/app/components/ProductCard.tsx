'use client';

import Link from 'next/link';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useCart } from '@/app/components/cart/use-cart';
import { useCurrency } from '@/app/hooks/use-currency';

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

const MOCK_RATINGS: Record<string, number> = {};
function getRating(id: string) {
  if (!MOCK_RATINGS[id]) MOCK_RATINGS[id] = 3.5 + Math.floor(Math.random() * 3) * 0.5;
  return MOCK_RATINGS[id];
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const imageUrl = product.images?.[0] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&fit=crop';
  const rating = 4.5;

  return (
    <div className="group card-hover rounded-2xl bg-card border border-border overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick view overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button asChild size="sm" variant="secondary" className="gap-1.5 shadow-lg bg-white/90 text-foreground hover:bg-white">
            <Link href={`/product/${product.slug}`}>
              <Eye className="h-3.5 w-3.5" />
              Quick view
            </Link>
          </Button>
        </div>

        {/* Category badge */}
        {product.category?.name && (
          <div className="absolute top-3 left-3">
            <Badge className="text-[11px] font-semibold px-2 py-0.5" style={{ background: 'var(--brand-violet)', color: '#fff' }}>
              {product.category.name}
            </Badge>
          </div>
        )}

        {/* UK flag */}
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/90 shadow flex items-center justify-center text-sm">
          🇬🇧
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-3 w-3"
                  style={{
                    fill: star <= Math.floor(rating) ? '#F59E0B' : 'transparent',
                    color: star <= Math.ceil(rating) ? '#F59E0B' : '#d1d5db'
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({rating})</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          {product.priceGBP ? (
            <div>
              <span className="text-lg font-bold">{formatPrice(product.priceGBP)}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Request quote</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1">
            <Link href={`/product/${product.slug}`}>
              <Eye className="h-3 w-3" /> View
            </Link>
          </Button>
          <Button
            size="sm"
            className="w-full text-xs gap-1"
            style={{ background: 'var(--brand-violet)', color: '#fff' }}
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
            <ShoppingCart className="h-3 w-3" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
