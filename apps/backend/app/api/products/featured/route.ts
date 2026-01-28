import { ok } from '../../../../lib/response';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true, category: { isActive: true } },
    include: { category: true },
    orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'desc' }]
  });

  return ok({ products });
}
