import type { ResolvedProduct } from './types';
import { extractOpenGraphMeta } from './html';
import { coerceString } from './utils';

type JdSize = {
  size: string;
  available: boolean | null;
  sku: string | null;
  upc: string | null;
};

type JdProductType = {
  id: string | null;
  name: string | null;
  description: string | null;
  unitPrice: number | null;
  brand: string | null;
  colour: string | null;
  primaryImage: string | null;
  isDiscounted: boolean | null;
};

function decodeHtmlEntities(doc: Document, value: string) {
  const textarea = doc.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function parseJsString(doc: Document, raw: string) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    let value = trimmed.slice(1, -1);
    value = value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return decodeHtmlEntities(doc, value);
  }
  return null;
}

function parseJsNumber(raw: string) {
  const value = Number.parseFloat(raw.replace(/[^\d.]/g, ''));
  return Number.isFinite(value) ? value : null;
}

function parseJsBoolean(raw: string) {
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
}

function extractProductType(doc: Document): JdProductType | null {
  const scripts = Array.from(doc.querySelectorAll('script'));
  const script = scripts.find((node) => node.textContent?.includes('var ProductType ='));
  if (!script?.textContent) return null;

  const match = script.textContent.match(/var\s+ProductType\s*=\s*\{([\s\S]*?)\};/);
  if (!match) return null;
  const body = match[1];

  const extract = (key: string) => {
    const valueMatch = body.match(new RegExp(`${key}\\s*:\\s*([^,}]+)`));
    return valueMatch ? valueMatch[1] : null;
  };

  const id = parseJsString(doc, extract('Id') ?? '') ?? null;
  const name = parseJsString(doc, extract('Name') ?? '') ?? null;
  const description = parseJsString(doc, extract('Description') ?? '') ?? null;
  const unitPrice = extract('UnitPrice') ? parseJsNumber(extract('UnitPrice') ?? '') : null;
  const brand = parseJsString(doc, extract('Brand') ?? '') ?? null;
  const colour = parseJsString(doc, extract('Colour') ?? '') ?? null;
  const primaryImage = parseJsString(doc, extract('PrimaryImage') ?? '') ?? null;
  const isDiscounted = extract('IsDiscounted')
    ? parseJsBoolean(extract('IsDiscounted') ?? '')
    : null;

  return {
    id,
    name,
    description,
    unitPrice,
    brand,
    colour,
    primaryImage,
    isDiscounted
  };
}

function parsePrice(raw: string | null) {
  if (!raw) return null;
  const numeric = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  const value = Number.parseFloat(numeric);
  return Number.isFinite(value) ? value : null;
}

function inferCurrency(raw: string | null) {
  if (!raw) return null;
  if (raw.includes('£')) return 'GBP';
  if (raw.includes('€')) return 'EUR';
  if (raw.includes('$')) return 'USD';
  return null;
}

export function resolveJdSportsProduct(doc: Document, url: string): ResolvedProduct | null {
  const title =
    coerceString(doc.querySelector('[data-e2e="product-name"]')?.textContent?.trim()) ??
    coerceString(doc.querySelector('h1[itemprop="name"]')?.textContent?.trim());

  const priceNode = doc.querySelector('[data-e2e="product-price"]');
  const priceRaw =
    coerceString(priceNode?.getAttribute('content')) ??
    coerceString(priceNode?.textContent?.trim());
  const price = parsePrice(priceRaw);

  const sizeButtons = Array.from(
    doc.querySelectorAll<HTMLButtonElement>('#productSizeStock button[data-size]')
  );
  const sizes: JdSize[] = sizeButtons
    .map((button) => {
      const size =
        coerceString(button.getAttribute('data-size')) ??
        coerceString(button.textContent?.trim());
      if (!size) return null;
      const stockRaw = coerceString(button.getAttribute('data-stock'));
      const available = stockRaw === '1' ? true : stockRaw === '0' ? false : null;
      return {
        size,
        available,
        sku: coerceString(button.getAttribute('data-sku')),
        upc: coerceString(button.getAttribute('data-upc'))
      };
    })
    .filter((item): item is JdSize => Boolean(item));

  const productType = extractProductType(doc);

  const imageUrl =
    productType?.primaryImage ??
    coerceString(doc.querySelector('#gallery img')?.getAttribute('src')) ??
    extractOpenGraphMeta(doc, 'og:image');

  const itemOptions = doc.querySelector('#itemOptions');
  const stockRaw = coerceString(itemOptions?.getAttribute('data-stock'));
  const availability =
    stockRaw == null
      ? sizes.length
        ? sizes.some((size) => size.available === true)
        : null
      : stockRaw.toLowerCase() === 'true';

  const currency =
    coerceString(sizeButtons[0]?.getAttribute('data-currency')) ??
    inferCurrency(priceRaw);

  const resolvedPrice = price ?? productType?.unitPrice ?? null;

  return {
    title: title ?? productType?.name ?? new URL(url).hostname,
    imageUrl: imageUrl ?? null,
    price: resolvedPrice,
    currency: currency ?? null,
    raw: {
      productId: productType?.id ?? null,
      description: productType?.description ?? null,
      brand: productType?.brand ?? null,
      colour: productType?.colour ?? null,
      isDiscounted: productType?.isDiscounted ?? null,
      availability,
      sizes
    }
  };
}
