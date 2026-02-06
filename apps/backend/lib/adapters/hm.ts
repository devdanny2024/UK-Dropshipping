import type { ResolvedProduct } from './types';
import { extractJsonLdProduct, extractPriceFromJsonLd } from './html';
import { coerceString, parseAvailability } from './utils';

export function resolveHmProduct(doc: Document, url: string): ResolvedProduct | null {
  const product = extractJsonLdProduct(doc);
  if (!product) return null;

  const title = coerceString(product.name);
  const imageUrl = Array.isArray(product.image)
    ? coerceString(product.image[0])
    : coerceString(product.image);

  const priceInfo = extractPriceFromJsonLd(product);
  const availability = parseAvailability(product.offers?.availability);

  return {
    title: title ?? new URL(url).hostname,
    imageUrl,
    price: priceInfo.price,
    currency: priceInfo.currency,
    raw: {
      sku: coerceString(product.sku),
      brand: coerceString(product.brand?.name ?? product.brand),
      availability
    }
  };
}
