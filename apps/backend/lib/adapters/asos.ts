import type { ResolvedProduct } from './types';
import { extractJsonLdProduct, extractPriceFromJsonLd, extractOpenGraphMeta } from './html';
import { coerceString, parseAvailability } from './utils';

export function resolveAsosProduct(doc: Document, url: string): ResolvedProduct | null {
  const product = extractJsonLdProduct(doc);
  const titleFromDom =
    coerceString(doc.querySelector('[data-testid="product-title"]')?.textContent?.trim()) ??
    coerceString(doc.querySelector('h1')?.textContent?.trim());

  const priceNode = doc.querySelector('[data-testid="current-price"]');
  const priceRaw =
    coerceString(priceNode?.textContent?.trim()) ??
    coerceString(doc.querySelector('[data-testid="price-screenreader-only-text"]')?.textContent?.trim());
  const price = priceRaw
    ? Number.parseFloat(priceRaw.replace(/[^\d.,]/g, '').replace(',', '.'))
    : null;
  const currency =
    priceRaw?.includes('£')
      ? 'GBP'
      : priceRaw?.includes('€')
      ? 'EUR'
      : priceRaw?.includes('$')
      ? 'USD'
      : null;

  const imageUrl =
    coerceString(doc.querySelector('.gallery-image')?.getAttribute('src')) ??
    extractOpenGraphMeta(doc, 'og:image');

  const color = coerceString(doc.querySelector('[data-testid="productColour"] p')?.textContent?.trim());

  const sizeOptions = Array.from(doc.querySelectorAll<HTMLSelectElement>('#variantSelector option'))
    .map((option) => {
      const value = coerceString(option.getAttribute('value'));
      const label = coerceString(option.textContent?.trim());
      if (!label || !value || value === '') return null;
      const available = label.toLowerCase().includes('out of stock') ? false : true;
      return { id: value, label, available };
    })
    .filter((item): item is { id: string; label: string; available: boolean } => Boolean(item));

  if (product) {
    const title = coerceString(product.name);
    const imageFromJsonLd = Array.isArray(product.image)
      ? coerceString(product.image[0])
      : coerceString(product.image);
    const priceInfo = extractPriceFromJsonLd(product);
    const availability = parseAvailability(product.offers?.availability);

    return {
      title: title ?? titleFromDom ?? new URL(url).hostname,
      imageUrl: imageFromJsonLd ?? imageUrl,
      price: priceInfo.price ?? price,
      currency: priceInfo.currency ?? currency,
      raw: {
        sku: coerceString(product.sku),
        brand: coerceString(product.brand?.name ?? product.brand),
        availability,
        color,
        sizes: sizeOptions
      }
    };
  }

  if (!titleFromDom && !imageUrl && price == null) return null;

  return {
    title: titleFromDom ?? new URL(url).hostname,
    imageUrl,
    price,
    currency,
    raw: {
      color,
      sizes: sizeOptions
    }
  };
}
