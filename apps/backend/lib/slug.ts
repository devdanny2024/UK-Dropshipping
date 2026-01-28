import { prisma } from './prisma';

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUnique(base: string, check: (slug: string) => Promise<boolean>) {
  let slug = base;
  let counter = 2;
  while (await check(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function uniqueCategorySlug(nameOrSlug: string, excludeId?: string) {
  const base = slugify(nameOrSlug);
  return ensureUnique(base || 'category', async (slug) => {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) return false;
    return existing.id !== excludeId;
  });
}

export async function uniqueProductSlug(nameOrSlug: string, excludeId?: string) {
  const base = slugify(nameOrSlug);
  return ensureUnique(base || 'product', async (slug) => {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) return false;
    return existing.id !== excludeId;
  });
}
