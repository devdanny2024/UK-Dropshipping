/**
 * Weight resolution helpers.
 *
 * Lookup order:
 * 1. Product-level chargeableWeightGrams (set directly on the Product record)
 * 2. Named product entry in WeightReference (isNamedProduct = true), matched by label
 * 3. Category fallback weight from WeightReference (isNamedProduct = false)
 * 4. Category model defaultChargeableWeightGrams
 * 5. Absolute fallback: 500g chargeable
 *
 * When no specific chargeable weight is found (falling to category or absolute fallback),
 * a 15% packaging overhead is applied to the actual/base weight before arriving at the
 * chargeable weight.
 */

import { prisma } from './prisma';

const PACKAGING_OVERHEAD = 1.15;
const ABSOLUTE_FALLBACK_GRAMS = 500;

export type WeightResolution = {
  chargeableWeightGrams: number;
  actualWeightGrams: number | null;
  /** How the weight was resolved */
  source: 'product' | 'named_product_ref' | 'category_ref' | 'category_default' | 'fallback';
};

/**
 * Resolve chargeable weight for a product.
 * @param productId - The product DB id (optional — for catalogue products)
 * @param categoryId - The category DB id
 * @param productName - The product name (used to fuzzy-match named product refs)
 */
export async function resolveChargeableWeight(
  productId: string | null,
  categoryId: string,
  productName: string
): Promise<WeightResolution> {
  // 1. Product-level weight
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { chargeableWeightGrams: true, weightGrams: true }
    });
    if (product?.chargeableWeightGrams) {
      return {
        chargeableWeightGrams: product.chargeableWeightGrams,
        actualWeightGrams: product.weightGrams ?? null,
        source: 'product'
      };
    }
  }

  // 2. Named product reference — match label against product name (case-insensitive)
  const namedRef = await prisma.weightReference.findFirst({
    where: {
      isNamedProduct: true,
      label: { contains: productName.substring(0, 30), mode: 'insensitive' }
    }
  });
  if (namedRef) {
    return {
      chargeableWeightGrams: namedRef.chargeableWeightGrams,
      actualWeightGrams: namedRef.actualWeightGrams ?? null,
      source: 'named_product_ref'
    };
  }

  // 3. Category fallback weight references
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true, defaultChargeableWeightGrams: true, defaultWeightGrams: true }
  });

  if (category) {
    const categoryRef = await prisma.weightReference.findFirst({
      where: {
        isNamedProduct: false,
        category: { equals: category.slug, mode: 'insensitive' }
      },
      orderBy: { chargeableWeightGrams: 'asc' }
    });
    if (categoryRef) {
      return {
        chargeableWeightGrams: categoryRef.chargeableWeightGrams,
        actualWeightGrams: categoryRef.actualWeightGrams ?? null,
        source: 'category_ref'
      };
    }

    // 4. Category model default
    if (category.defaultChargeableWeightGrams) {
      return {
        chargeableWeightGrams: category.defaultChargeableWeightGrams,
        actualWeightGrams: category.defaultWeightGrams ?? null,
        source: 'category_default'
      };
    }
  }

  // 5. Absolute fallback with packaging overhead
  return {
    chargeableWeightGrams: Math.round(ABSOLUTE_FALLBACK_GRAMS * PACKAGING_OVERHEAD),
    actualWeightGrams: null,
    source: 'fallback'
  };
}

/**
 * Calculate extra shipping cost in NGN based on chargeable weight.
 * @param chargeableWeightGrams - Weight in grams
 * @param ratePerKgNgn - Configured rate per kg
 */
export function calcShippingCostNgn(chargeableWeightGrams: number, ratePerKgNgn: number): number {
  const kg = chargeableWeightGrams / 1000;
  return Math.round(kg * ratePerKgNgn * 100) / 100;
}
