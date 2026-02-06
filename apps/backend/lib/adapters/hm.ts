import type { ResolvedProduct } from './types';
import { extractJsonLdProduct, extractPriceFromJsonLd, extractOpenGraphMeta } from './html';
import { coerceString, parseAvailability } from './utils';

export function resolveHmProduct(doc: Document, url: string): ResolvedProduct | null {
  const product = extractJsonLdProduct(doc);
  const titleFromDom = coerceString(
    doc.querySelector('[data-testid="product-name"]')?.textContent?.trim()
  );

  const priceRaw = coerceString(
    doc.querySelector('[data-testid="white-price"]')?.textContent?.trim()
  );
  const price = priceRaw
    ? Number.parseFloat(priceRaw.replace(/[^\d.,]/g, '').replace(',', '.'))
    : null;
  const currency =
    priceRaw?.includes('$')
      ? 'USD'
      : priceRaw?.includes('£')
      ? 'GBP'
      : priceRaw?.includes('€')
      ? 'EUR'
      : null;

  const imageUrl =
    coerceString(doc.querySelector('[data-testid="next-image"] img')?.getAttribute('src')) ??
    extractOpenGraphMeta(doc, 'og:image');

  const color = coerceString(
    doc.querySelector('[data-testid="color-selector"] p')?.textContent?.trim()
  );

  const sizeButtons = Array.from(
    doc.querySelectorAll('[data-testid^="sizeButton-"]')
  );
  const sizes = sizeButtons
    .map((button) => {
      const label = coerceString(button.textContent?.trim());
      if (!label) return null;
      const ariaLabel = coerceString(button.getAttribute('aria-label'));
      const available = ariaLabel
        ? !ariaLabel.toLowerCase().includes('out of stock')
        : null;
      return { label, available };
    })
    .filter((item): item is { label: string; available: boolean | null } => Boolean(item));

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
        sizes
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
      sizes
    }
  };
}
