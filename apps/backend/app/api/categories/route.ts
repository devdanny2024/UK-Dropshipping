import { ok } from '../../../lib/response';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } }
  });

  return ok({
    categories: categories.map((cat) => ({
      ...cat,
      productCount: cat._count.products
    }))
  });
}
