import { JSDOM } from 'jsdom';
import type { ResolvedProduct } from './types';
import { resolveGenericProduct } from './html';
import { resolveNikeProduct } from './nike';
import { resolveAsosProduct } from './asos';
import { resolveZaraProduct } from './zara';
import { resolveAmazonUkProduct } from './amazon-uk';
import { resolveHmProduct } from './hm';
import { resolveJdSportsProduct } from './jd-sports';

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

  const hostname = new URL(url).hostname.toLowerCase();
  const generic = resolveGenericProduct(document, url);

  let resolved: ResolvedProduct = generic;
  let storeRaw: Record<string, unknown> | null = null;

  if (hostname.includes('nike.com')) {
    const nike = resolveNikeProduct(document, url);
    if (nike) {
      resolved = {
        title: nike.title || generic.title,
        imageUrl: nike.imageUrl ?? generic.imageUrl,
        price: nike.price ?? generic.price,
        currency: nike.currency ?? generic.currency,
        raw: nike.raw
      };
      storeRaw = { nike: nike.raw };
    }
  }

  if (hostname.includes('asos.com')) {
    const asos = resolveAsosProduct(document, url);
    if (asos) {
      resolved = {
        title: asos.title || generic.title,
        imageUrl: asos.imageUrl ?? generic.imageUrl,
        price: asos.price ?? generic.price,
        currency: asos.currency ?? generic.currency,
        raw: asos.raw
      };
      storeRaw = { asos: asos.raw };
    }
  }

  if (hostname.includes('zara.com')) {
    const zara = resolveZaraProduct(document, url);
    if (zara) {
      resolved = {
        title: zara.title || generic.title,
        imageUrl: zara.imageUrl ?? generic.imageUrl,
        price: zara.price ?? generic.price,
        currency: zara.currency ?? generic.currency,
        raw: zara.raw
      };
      storeRaw = { zara: zara.raw };
    }
  }

  if (hostname.includes('amazon.co.uk')) {
    const amazon = resolveAmazonUkProduct(document, url);
    if (amazon) {
      resolved = {
        title: amazon.title || generic.title,
        imageUrl: amazon.imageUrl ?? generic.imageUrl,
        price: amazon.price ?? generic.price,
        currency: amazon.currency ?? generic.currency,
        raw: amazon.raw
      };
      storeRaw = { amazonUk: amazon.raw };
    }
  }

  if (hostname.includes('hm.com')) {
    const hm = resolveHmProduct(document, url);
    if (hm) {
      resolved = {
        title: hm.title || generic.title,
        imageUrl: hm.imageUrl ?? generic.imageUrl,
        price: hm.price ?? generic.price,
        currency: hm.currency ?? generic.currency,
        raw: hm.raw
      };
      storeRaw = { hm: hm.raw };
    }
  }

  if (hostname.includes('jdsports.')) {
    const jd = resolveJdSportsProduct(document, url);
    if (jd) {
      resolved = {
        title: jd.title || generic.title,
        imageUrl: jd.imageUrl ?? generic.imageUrl,
        price: jd.price ?? generic.price,
        currency: jd.currency ?? generic.currency,
        raw: jd.raw
      };
      storeRaw = { jdSports: jd.raw };
    }
  }

  return {
    ...resolved,
    raw: {
      source: 'html',
      url,
      store: storeRaw,
      generic: generic.raw
    }
  };
}

export type { ResolvedProduct };
