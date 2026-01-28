import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { categorySchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';
import { uniqueCategorySlug } from '../../../../../lib/slug';

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, categorySchema.partial());
  if (error) return error;

  const existing = await prisma.category.findUnique({ where: { id: context.params.id } });
  if (!existing) return fail('NOT_FOUND', 'Category not found', 404);

  let slug = existing.slug;
  if (data.slug || data.name) {
    slug = await uniqueCategorySlug(data.slug ?? data.name ?? existing.name, existing.id);
  }

  const category = await prisma.category.update({
    where: { id: existing.id },
    data: {
      name: data.name ?? undefined,
      slug,
      description: data.description ?? undefined,
      imageUrl: data.imageUrl ?? undefined,
      isActive: data.isActive ?? undefined,
      sortOrder: data.sortOrder ?? undefined
    }
  });

  return ok({ category });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const existing = await prisma.category.findUnique({ where: { id: context.params.id } });
  if (!existing) return fail('NOT_FOUND', 'Category not found', 404);

  await prisma.category.delete({ where: { id: existing.id } });
  return ok({ deleted: true });
}
