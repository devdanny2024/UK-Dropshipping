import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { productSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';
import { uniqueProductSlug } from '../../../../../lib/slug';

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, productSchema.partial());
  if (error) return error;

  const existing = await prisma.product.findUnique({ where: { id: context.params.id } });
  if (!existing) return fail('NOT_FOUND', 'Product not found', 404);

  let slug = existing.slug;
  if (data.slug || data.name) {
    slug = await uniqueProductSlug(data.slug ?? data.name ?? existing.name, existing.id);
  }

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      name: data.name ?? undefined,
      slug,
      categoryId: data.categoryId ?? undefined,
      description: data.description ?? undefined,
      images: data.images ?? undefined,
      productCode: data.productCode ?? undefined,
      externalUrl: data.externalUrl ?? undefined,
      priceGBP: data.priceGBP ?? undefined,
      currency: data.currency ?? undefined,
      isActive: data.isActive ?? undefined,
      isFeatured: data.isFeatured ?? undefined,
      featuredOrder: data.featuredOrder ?? undefined
    }
  });

  return ok({ product });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const existing = await prisma.product.findUnique({ where: { id: context.params.id } });
  if (!existing) return fail('NOT_FOUND', 'Product not found', 404);

  await prisma.product.delete({ where: { id: existing.id } });
  return ok({ deleted: true });
}
