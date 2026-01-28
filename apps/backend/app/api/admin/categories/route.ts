import type { NextRequest } from 'next/server';
import { ok } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { categorySchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { uniqueCategorySlug } from '../../../../lib/slug';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
  });

  return ok({ categories });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, categorySchema);
  if (error) return error;

  const slug = await uniqueCategorySlug(data.slug ?? data.name);

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0
    }
  });

  return ok({ category });
}
