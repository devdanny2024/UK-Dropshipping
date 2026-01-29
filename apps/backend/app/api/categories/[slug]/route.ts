import { ok, fail } from '../../../../lib/response';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: { slug: string } }) {
  const category = await prisma.category.findFirst({
    where: { slug: context.params.slug, isActive: true },
    include: {
      products: {
        where: { isActive: true },
        orderBy: [{ featuredOrder: 'desc' }, { createdAt: 'desc' }]
      }
    }
  });

  if (!category) {
    return fail('NOT_FOUND', 'Category not found', 404);
  }

  return ok({ category });
}
