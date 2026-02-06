import type { ResolvedProduct } from './types';
import { extractJsonLdProduct, extractPriceFromJsonLd, extractOpenGraphMeta } from './html';
import { coerceString, parseAvailability } from './utils';

export function resolveZaraProduct(doc: Document, url: string): ResolvedProduct | null {
  const product = extractJsonLdProduct(doc);

  const titleFromDom =
    coerceString(doc.querySelector('[data-qa-qualifier="product-detail-info-name"]')?.textContent?.trim()) ??
    coerceString(doc.querySelector('h1')?.textContent?.trim());

  const priceRaw = coerceString(
    doc.querySelector('.money-amount__main')?.textContent?.trim()
  );
  const price = priceRaw
    ? Number.parseFloat(priceRaw.replace(/[^\d.,]/g, '').replace(',', '.'))
    : null;
  const currency =
    priceRaw?.includes('GBP')
      ? 'GBP'
      : priceRaw?.includes('EUR')
      ? 'EUR'
      : priceRaw?.includes('USD')
      ? 'USD'
      : null;

  const imageUrl =
    coerceString(doc.querySelector('.product-detail-view__main-image img')?.getAttribute('src')) ??
    extractOpenGraphMeta(doc, 'og:image');

  const color = coerceString(
    doc.querySelector('[data-qa-qualifier="product-detail-info-color"]')?.textContent?.trim()
  );

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
        color
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
      color
    }
  };
}
