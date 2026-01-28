import type { NextRequest } from 'next/server';
import { ok } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { productSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { uniqueProductSlug } from '../../../../lib/slug';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const categoryId = request.nextUrl.searchParams.get('categoryId') ?? undefined;
  const search = request.nextUrl.searchParams.get('search') ?? undefined;

  const products = await prisma.product.findMany({
    where: {
      categoryId,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } }
          ]
        : undefined
    },
    include: { category: true },
    orderBy: [{ createdAt: 'desc' }]
  });

  return ok({ products });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, productSchema);
  if (error) return error;

  const slug = await uniqueProductSlug(data.slug ?? data.name);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      categoryId: data.categoryId,
      description: data.description,
      images: data.images ?? undefined,
      productCode: data.productCode,
      externalUrl: data.externalUrl,
      priceGBP: data.priceGBP ?? undefined,
      currency: data.currency ?? 'GBP',
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      featuredOrder: data.featuredOrder ?? 0
    }
  });

  return ok({ product });
}
