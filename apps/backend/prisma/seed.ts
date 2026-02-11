import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/slug';
import { STORE_ADAPTERS } from '../lib/store-adapters';

const prisma = new PrismaClient();

const categories = [
  'Men Shoes',
  'Women Clothing',
  'Accessories',
  'Beauty & Perfume',
  'Baby & Kids',
  'Sports',
  'Home & Kitchen',
  'Electronics',
  'Motors',
  'Luxury'
];

const sampleNames = [
  'Classic',
  'Premium',
  'Urban',
  'Elite',
  'Essential',
  'Heritage',
  'Studio',
  'Lightweight',
  'Pro',
  'Signature'
];

const productNouns = [
  'Sneakers',
  'Hoodie',
  'Handbag',
  'Watch',
  'Perfume',
  'Backpack',
  'Mixer',
  'Headphones',
  'Jacket',
  'Sofa',
  'Jersey',
  'Laptop Sleeve',
  'Car Mat',
  'Lamp',
  'Boots'
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]) {
  return items[randomInt(0, items.length - 1)];
}

async function seedAdaptersAndSettings() {
  for (const adapter of STORE_ADAPTERS) {
    await prisma.adapterState.upsert({
      where: { id: adapter.id },
      update: {
        name: adapter.name,
        domain: adapter.domain,
        region: adapter.region
      },
      create: {
        id: adapter.id,
        name: adapter.name,
        domain: adapter.domain,
        region: adapter.region,
        enabled: true,
        status: 'UNKNOWN'
      }
    });
  }

  await prisma.appSetting.upsert({
    where: { key: 'platform_fee_percent' },
    update: {},
    create: { key: 'platform_fee_percent', value: '5' }
  });
}

async function main() {
  await seedAdaptersAndSettings();

  const existingCategories = await prisma.category.count();
  if (existingCategories > 0) {
    console.log('Seed skipped for catalog: categories already exist.');
    return;
  }

  for (let i = 0; i < categories.length; i += 1) {
    const name = categories[i];
    const slug = slugify(name);
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: `${name} curated for UK2MeOnline.`,
        isActive: true,
        sortOrder: i
      }
    });

    const productCount = randomInt(6, 12);
    for (let j = 0; j < productCount; j += 1) {
      const namePrefix = pick(sampleNames);
      const nameSuffix = pick(productNouns);
      const productName = `${namePrefix} ${nameSuffix}`;
      const baseSlug = slugify(`${productName}-${category.slug}`);
      const suffix = randomInt(1, 9999);
      const slug = `${baseSlug}-${suffix}`;

      await prisma.product.create({
        data: {
          categoryId: category.id,
          name: productName,
          slug,
          description: `UK2MeOnline curated ${productName.toLowerCase()} from trusted stores.`,
          images: [
            `https://picsum.photos/seed/${slug}/800/800`,
            `https://picsum.photos/seed/${slug}-alt/800/800`
          ],
          productCode: `UK2ME-${randomInt(1000, 9999)}`,
          externalUrl: `https://example.com/products/${slug}`,
          priceGBP: randomInt(25, 450),
          currency: 'GBP',
          isActive: Math.random() > 0.1,
          isFeatured: Math.random() > 0.7,
          featuredOrder: randomInt(1, 10)
        }
      });
    }
  }

  console.log('Seed completed: categories and products created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
