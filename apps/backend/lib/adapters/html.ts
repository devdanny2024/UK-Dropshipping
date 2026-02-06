import type { ResolvedProduct } from './types';

export function extractJsonLdProduct(doc: Document) {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const products: any[] = [];

  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent || 'null');
      if (!json) continue;

      if (Array.isArray(json)) {
        for (const item of json) {
          if (typeof item === 'object' && item && hasProductType(item)) {
            products.push(item);
          }
        }
      } else if (typeof json === 'object' && hasProductType(json)) {
        products.push(json);
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  return products[0] ?? null;
}

function hasProductType(node: any) {
  const type = node['@type'];
  if (!type) return false;
  if (typeof type === 'string') return type.toLowerCase() === 'product';
  if (Array.isArray(type)) {
    return type.some(
      (t) => typeof t === 'string' && t.toLowerCase() === 'product'
    );
  }
  return false;
}

export function extractOpenGraphMeta(doc: Document, property: string) {
  const meta = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  return meta?.getAttribute('content') ?? null;
}

export function extractNextData(doc: Document) {
  const script = doc.querySelector('script#__NEXT_DATA__');
  if (!script?.textContent) return null;

  try {
    return JSON.parse(script.textContent);
  } catch {
    return null;
  }
}

export function extractPriceFromNextData(doc: Document) {
  const data = extractNextData(doc);
  if (!data) {
    return { price: null as number | null, currency: null as string | null };
  }

  try {
    const stack: any[] = [data];
    let foundPrice: number | null = null;
    let foundCurrency: string | null = null;

    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;

      const anyNode = node as any;

      if (typeof anyNode.currentPrice === 'number' && foundPrice == null) {
        foundPrice = anyNode.currentPrice;
      } else if (typeof anyNode.fullPrice === 'number' && foundPrice == null) {
        foundPrice = anyNode.fullPrice;
      }

      if (typeof anyNode.currency === 'string' && !foundCurrency) {
        foundCurrency = anyNode.currency;
      } else if (typeof anyNode.currencyCode === 'string' && !foundCurrency) {
        foundCurrency = anyNode.currencyCode;
      }

      if (foundPrice != null && foundCurrency) break;

      if (Array.isArray(node)) {
        for (const item of node) {
          if (item && typeof item === 'object') stack.push(item);
        }
      } else {
        for (const value of Object.values(node)) {
          if (value && typeof value === 'object') stack.push(value);
        }
      }
    }

    return { price: foundPrice, currency: foundCurrency };
  } catch {
    return { price: null as number | null, currency: null as string | null };
  }
}

export function extractPriceFromJsonLd(product: any) {
  const offers = product.offers;
  if (!offers) return { price: null as number | null, currency: null as string | null };

  const offer = Array.isArray(offers) ? offers[0] : offers;
  const rawPrice = offer.price ?? offer.priceAmount ?? offer.lowPrice ?? offer.highPrice;
  const currency =
    offer.priceCurrency ??
    offer.currency ??
    (typeof offer.priceSpecification === 'object'
      ? offer.priceSpecification.priceCurrency
      : null) ??
    null;

  const price =
    typeof rawPrice === 'number'
      ? rawPrice
      : typeof rawPrice === 'string'
      ? Number.parseFloat(rawPrice.replace(/[^\d.,]/g, '').replace(',', '.'))
      : null;

  return { price, currency };
}

export function resolveGenericProduct(doc: Document, url: string): ResolvedProduct {
  const productJsonLd = extractJsonLdProduct(doc);

  let title: string | null = null;
  let imageUrl: string | null = null;
  let price: number | null = null;
  let currency: string | null = null;

  if (productJsonLd) {
    title = productJsonLd.name ?? null;

    if (Array.isArray(productJsonLd.image)) {
      imageUrl = productJsonLd.image[0] ?? null;
    } else if (typeof productJsonLd.image === 'string') {
      imageUrl = productJsonLd.image;
    }

    const priceInfo = extractPriceFromJsonLd(productJsonLd);
    price = priceInfo.price;
    currency = priceInfo.currency;
  }

  if (price == null || !currency) {
    const nextPrice = extractPriceFromNextData(doc);
    if (price == null && nextPrice.price != null) {
      price = nextPrice.price;
    }
    if (!currency && nextPrice.currency) {
      currency = nextPrice.currency;
    }
  }

  if (!title) {
    title =
      extractOpenGraphMeta(doc, 'og:title') ??
      doc.querySelector('title')?.textContent?.trim() ??
      null;
  }

  if (!imageUrl) {
    imageUrl = extractOpenGraphMeta(doc, 'og:image');
  }

  if (!currency) {
    const ogCurrency = extractOpenGraphMeta(doc, 'product:price:currency');
    currency = ogCurrency ?? null;
  }

  return {
    title: title ?? new URL(url).hostname,
    imageUrl,
    price,
    currency,
    raw: {
      jsonLd: productJsonLd,
      og: {
        title: extractOpenGraphMeta(doc, 'og:title'),
        image: extractOpenGraphMeta(doc, 'og:image')
      }
    }
  };
}
