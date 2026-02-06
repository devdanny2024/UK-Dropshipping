import type { ResolvedProduct } from './types';
import { extractNextData } from './html';
import { coerceString } from './utils';

type NikeSize = {
  label: string;
  localizedLabel: string | null;
  status: string | null;
  available: boolean | null;
};

type NikeColorVariant = {
  styleColor: string | null;
  colorDescription: string | null;
  imageUrl: string | null;
  pdpUrl: string | null;
};

function resolveNikeProduct(doc: Document) {
  const data = extractNextData(doc);
  const pageProps = data?.props?.pageProps;
  if (!pageProps) return null;

  const selectedProduct = pageProps.selectedProduct ?? null;
  const productGroups = Array.isArray(pageProps.productGroups)
    ? pageProps.productGroups
    : [];

  let product: any = selectedProduct;
  if (!product) {
    for (const group of productGroups) {
      const products = group?.products;
      if (products && typeof products === 'object') {
        const first = Object.values(products).find(
          (item) => item && typeof item === 'object'
        );
        if (first) {
          product = first;
          break;
        }
      }
    }
  }

  if (!product) return null;

  const info = product.productInfo ?? {};
  const title =
    info.fullTitle ??
    (info.title && info.subtitle ? `${info.title} ${info.subtitle}` : null) ??
    info.title ??
    null;

  let imageUrl: string | null = null;
  const contentImages = Array.isArray(product.contentImages) ? product.contentImages : [];
  for (const item of contentImages) {
    if (item?.cardType !== 'image') continue;
    const props = item?.properties ?? {};
    imageUrl =
      props.portrait?.url ??
      props.squarish?.url ??
      null;
    if (imageUrl) break;
  }

  if (!imageUrl) {
    const colorwayImages = Array.isArray(pageProps.colorwayImages)
      ? pageProps.colorwayImages
      : [];
    imageUrl =
      colorwayImages[0]?.portraitImg ??
      colorwayImages[0]?.squarishImg ??
      null;
  }

  const price =
    typeof product?.prices?.currentPrice === 'number'
      ? product.prices.currentPrice
      : typeof product?.prices?.initialPrice === 'number'
      ? product.prices.initialPrice
      : null;

  const currency =
    typeof product?.prices?.currency === 'string'
      ? product.prices.currency
      : typeof pageProps?.locale?.currency === 'string'
      ? pageProps.locale.currency
      : null;

  const statusModifier = coerceString(product?.statusModifier);
  const isAvailable =
    statusModifier == null
      ? null
      : statusModifier.toUpperCase().includes('BUY')
      ? true
      : statusModifier.toUpperCase().includes('SOLD') ||
        statusModifier.toUpperCase().includes('OOS')
      ? false
      : null;

  const sizes: NikeSize[] = Array.isArray(product?.sizes)
    ? product.sizes.map((size: any) => {
        const status = coerceString(size?.status);
        const available =
          status == null
            ? null
            : status.toUpperCase() === 'ACTIVE'
            ? true
            : status.toUpperCase().includes('OOS') ||
              status.toUpperCase().includes('OUT')
            ? false
            : null;

        return {
          label: coerceString(size?.label) ?? '',
          localizedLabel: coerceString(size?.localizedLabel),
          status,
          available
        };
      })
    : [];

  const colorVariants: NikeColorVariant[] = Array.isArray(pageProps.colorwayImages)
    ? pageProps.colorwayImages.map((item: any) => ({
        styleColor: coerceString(item?.styleColor),
        colorDescription: coerceString(item?.colorDescription),
        imageUrl: coerceString(item?.portraitImg) ?? coerceString(item?.squarishImg),
        pdpUrl: coerceString(item?.pdpUrl)
      }))
    : [];

  return {
    title,
    imageUrl,
    price,
    currency,
    raw: {
      styleColor: coerceString(product?.styleColor),
      productId: coerceString(product?.id),
      statusModifier,
      available: isAvailable,
      sizes,
      colorVariants
    }
  };
}

export function resolveNikeProduct(
  doc: Document,
  url: string
): ResolvedProduct | null {
  const resolved = resolveNikeProduct(doc);
  if (!resolved) return null;

  return {
    title: resolved.title ?? new URL(url).hostname,
    imageUrl: resolved.imageUrl ?? null,
    price: resolved.price ?? null,
    currency: resolved.currency ?? null,
    raw: resolved.raw
  };
}
