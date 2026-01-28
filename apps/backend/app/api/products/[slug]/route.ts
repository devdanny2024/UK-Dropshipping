import { ok, fail } from '../../../../lib/response';
import { prisma } from '../../../../lib/prisma';

export async function GET(_request: Request, context: { params: { slug: string } }) {
  const product = await prisma.product.findFirst({
    where: { slug: context.params.slug, isActive: true, category: { isActive: true } },
    include: { category: true }
  });

  if (!product) {
    return fail('NOT_FOUND', 'Product not found', 404);
  }

  return ok({ product });
}
