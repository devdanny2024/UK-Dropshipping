import { JSDOM } from 'jsdom';

export type ResolvedProduct = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  raw: unknown;
};

function extractJsonLdProduct(doc: Document) {
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

function extractOpenGraphMeta(doc: Document, property: string) {
  const meta = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  return meta?.getAttribute('content') ?? null;
}

function extractPriceFromJsonLd(product: any) {
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

function getResolveTimeoutMs() {
  const raw = process.env.PRODUCT_RESOLVE_TIMEOUT_MS;
  const value = raw ? Number(raw) : NaN;
  if (!Number.isFinite(value) || value <= 0) {
    return 10000;
  }
  return value;
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutMs = getResolveTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveProductFromUrl(url: string): Promise<ResolvedProduct> {
  const response = await fetchWithTimeout(url, {
    // Use a generic desktop user agent string to improve chances of getting full HTML.
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; UK2MEProductResolver/1.0; +https://uk2meonline.com)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product URL (status ${response.status})`);
  }

  const html = await response.text();
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const productJsonLd = extractJsonLdProduct(document);

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

  // Fallbacks using standard meta tags if JSON-LD is missing or incomplete.
  if (!title) {
    title =
      extractOpenGraphMeta(document, 'og:title') ??
      document.querySelector('title')?.textContent?.trim() ??
      null;
  }

  if (!imageUrl) {
    imageUrl = extractOpenGraphMeta(document, 'og:image');
  }

  if (!currency) {
    const ogCurrency = extractOpenGraphMeta(document, 'product:price:currency');
    currency = ogCurrency ?? null;
  }

  const raw = {
    source: 'html',
    url,
    jsonLd: productJsonLd,
    og: {
      title: extractOpenGraphMeta(document, 'og:title'),
      image: extractOpenGraphMeta(document, 'og:image')
    }
  };

  return {
    title: title ?? new URL(url).hostname,
    imageUrl,
    price,
    currency,
    raw
  };
}
