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

// Weight reference seed data
const CATEGORY_WEIGHT_REFS = [
  // Women's Clothing
  { category: 'womens-clothing', label: 't-shirt/blouse', chargeableWeightGrams: Math.round(250 * 1.15) },
  { category: 'womens-clothing', label: 'dress_casual', chargeableWeightGrams: Math.round(400 * 1.15) },
  { category: 'womens-clothing', label: 'dress_formal', chargeableWeightGrams: Math.round(650 * 1.15) },
  { category: 'womens-clothing', label: 'jeans', actualWeightGrams: 850, chargeableWeightGrams: 1000 },
  { category: 'womens-clothing', label: 'trousers', chargeableWeightGrams: Math.round(550 * 1.15) },
  { category: 'womens-clothing', label: 'skirt', chargeableWeightGrams: Math.round(300 * 1.15) },
  { category: 'womens-clothing', label: 'jacket/blazer', chargeableWeightGrams: Math.round(1000 * 1.15) },
  { category: 'womens-clothing', label: 'winter_coat', chargeableWeightGrams: Math.round(2000 * 1.15) },
  { category: 'womens-clothing', label: 'cardigan/sweater', chargeableWeightGrams: Math.round(550 * 1.15) },
  { category: 'womens-clothing', label: 'underwear/bra', chargeableWeightGrams: Math.round(150 * 1.15) },
  { category: 'womens-clothing', label: 'leggings', chargeableWeightGrams: Math.round(250 * 1.15) },
  // Men's Clothing
  { category: 'mens-clothing', label: 't-shirt', chargeableWeightGrams: Math.round(300 * 1.15) },
  { category: 'mens-clothing', label: 'shirt', chargeableWeightGrams: Math.round(400 * 1.15) },
  { category: 'mens-clothing', label: 'jeans', actualWeightGrams: 900, chargeableWeightGrams: 1000 },
  { category: 'mens-clothing', label: 'trousers', chargeableWeightGrams: Math.round(650 * 1.15) },
  { category: 'mens-clothing', label: 'suit_jacket', chargeableWeightGrams: Math.round(1250 * 1.15) },
  { category: 'mens-clothing', label: 'full_suit', chargeableWeightGrams: Math.round(2000 * 1.15) },
  { category: 'mens-clothing', label: 'hoodie', chargeableWeightGrams: Math.round(650 * 1.15) },
  { category: 'mens-clothing', label: 'winter_coat', chargeableWeightGrams: Math.round(2250 * 1.15) },
  { category: 'mens-clothing', label: 'underwear', chargeableWeightGrams: Math.round(125 * 1.15) },
  { category: 'mens-clothing', label: 'shorts', chargeableWeightGrams: Math.round(400 * 1.15) },
  { category: 'mens-clothing', label: 'sweater', chargeableWeightGrams: Math.round(650 * 1.15) },
  // Children's Clothing
  { category: 'childrens-clothing', label: 't-shirt', chargeableWeightGrams: Math.round(150 * 1.15) },
  { category: 'childrens-clothing', label: 'dress', chargeableWeightGrams: Math.round(250 * 1.15) },
  { category: 'childrens-clothing', label: 'jeans', chargeableWeightGrams: Math.round(500 * 1.15) },
  { category: 'childrens-clothing', label: 'jacket', chargeableWeightGrams: Math.round(600 * 1.15) },
  { category: 'childrens-clothing', label: 'school_uniform', chargeableWeightGrams: Math.round(700 * 1.15) },
  { category: 'childrens-clothing', label: 'pyjamas', chargeableWeightGrams: Math.round(350 * 1.15) },
  // Footwear
  { category: 'footwear', label: 'womens_heels_flats', chargeableWeightGrams: 1500 },
  { category: 'footwear', label: 'womens_boots', chargeableWeightGrams: Math.round(1150 * 1.15) },
  { category: 'footwear', label: 'mens_dress_shoes', chargeableWeightGrams: 1500 },
  { category: 'footwear', label: 'mens_sneakers', actualWeightGrams: 800, chargeableWeightGrams: 1500 },
  { category: 'footwear', label: 'childrens_shoes', chargeableWeightGrams: Math.round(450 * 1.15) },
  { category: 'footwear', label: 'sandals_slippers', chargeableWeightGrams: Math.round(400 * 1.15) },
  // Accessories
  { category: 'accessories', label: 'belt', chargeableWeightGrams: Math.round(150 * 1.15) },
  { category: 'accessories', label: 'handbag_small', actualWeightGrams: 327, chargeableWeightGrams: 1000 },
  { category: 'accessories', label: 'handbag_large', chargeableWeightGrams: Math.round(800 * 1.15) },
  { category: 'accessories', label: 'scarf', chargeableWeightGrams: Math.round(150 * 1.15) },
  { category: 'accessories', label: 'hat_cap', chargeableWeightGrams: Math.round(150 * 1.15) },
  { category: 'accessories', label: 'socks_pair', chargeableWeightGrams: Math.round(75 * 1.15) },
  // Electronics / Other
  { category: 'electronics', label: 'phone_pouch', chargeableWeightGrams: Math.round(100 * 1.15) },
  { category: 'electronics', label: 'controller', chargeableWeightGrams: Math.round(300 * 1.15) },
  { category: 'electronics', label: 'media_player', chargeableWeightGrams: Math.round(600 * 1.15) },
  { category: 'electronics', label: 'water_bottle', chargeableWeightGrams: Math.round(150 * 1.15) },
  { category: 'electronics', label: 'stanley_cup', chargeableWeightGrams: Math.round(500 * 1.15) },
  { category: 'electronics', label: 'air_fryer', actualWeightGrams: 13000, chargeableWeightGrams: 15000 },
  { category: 'electronics', label: 'perfume', chargeableWeightGrams: Math.round(400 * 1.15) },
  // Home / Bedding
  { category: 'home-kitchen', label: 'duvet_set', actualWeightGrams: 1800, chargeableWeightGrams: 2500 },
  { category: 'home-kitchen', label: 'chocolate', chargeableWeightGrams: Math.round(250 * 1.15) },
  { category: 'home-kitchen', label: 'supplement', chargeableWeightGrams: Math.round(200 * 1.15) },
  { category: 'home-kitchen', label: 'soap', chargeableWeightGrams: Math.round(650 * 1.15) },
];

// Named product weight references from actual shipment data
const NAMED_PRODUCT_REFS = [
  { category: 'footwear', label: 'Court Heels UK8 Female', actualWeightGrams: 700, chargeableWeightGrams: 1500 },
  { category: 'footwear', label: 'Ballerina Shoe UK8 Female', actualWeightGrams: 650, chargeableWeightGrams: 1500 },
  { category: 'footwear', label: 'Sandal Block Heel UK6 Female', actualWeightGrams: 750, chargeableWeightGrams: 1500 },
  { category: 'accessories', label: 'Hand Bag (Tote) Small Female', actualWeightGrams: 327, chargeableWeightGrams: 1000 },
  { category: 'accessories', label: 'Bag Mini Female', actualWeightGrams: 150, chargeableWeightGrams: 500 },
  { category: 'childrens-clothing', label: 'Pants 7pairs 2-12yrs', actualWeightGrams: 150, chargeableWeightGrams: 500 },
  { category: 'womens-clothing', label: 'Shirt Dress Female', actualWeightGrams: 550, chargeableWeightGrams: 1000 },
  { category: 'womens-clothing', label: 'Peplum Blouse Female', actualWeightGrams: 550, chargeableWeightGrams: 1000 },
  { category: 'mens-clothing', label: '6 Pack Underwear 3XL Male', actualWeightGrams: 750, chargeableWeightGrams: 1000 },
  { category: 'mens-clothing', label: 'Jeans Male 42', actualWeightGrams: 900, chargeableWeightGrams: 1000 },
  { category: 'womens-clothing', label: 'Jeans Female', actualWeightGrams: 850, chargeableWeightGrams: 1000 },
  { category: 'footwear', label: 'Sneakers UK10 Male', actualWeightGrams: 550, chargeableWeightGrams: 1500 },
  { category: 'footwear', label: 'Sneakers UK5 with carton Male', actualWeightGrams: 800, chargeableWeightGrams: 1500 },
  { category: 'electronics', label: 'Film 1 Roll', actualWeightGrams: 2250, chargeableWeightGrams: 3000 },
  { category: 'electronics', label: 'Film 6 Rolls', actualWeightGrams: 14500, chargeableWeightGrams: 18000 },
  { category: 'electronics', label: 'Air Fryer', actualWeightGrams: 13000, chargeableWeightGrams: 15000 },
  { category: 'home-kitchen', label: 'Duvet Set Super King', actualWeightGrams: 1800, chargeableWeightGrams: 2500 },
];

async function seedWeightReferences() {
  let seeded = 0;
  for (const ref of CATEGORY_WEIGHT_REFS) {
    await prisma.weightReference.upsert({
      where: { category_label: { category: ref.category, label: ref.label } },
      update: {
        chargeableWeightGrams: ref.chargeableWeightGrams,
        actualWeightGrams: (ref as any).actualWeightGrams ?? null,
        isNamedProduct: false
      },
      create: {
        category: ref.category,
        label: ref.label,
        chargeableWeightGrams: ref.chargeableWeightGrams,
        actualWeightGrams: (ref as any).actualWeightGrams ?? null,
        isNamedProduct: false
      }
    });
    seeded++;
  }
  for (const ref of NAMED_PRODUCT_REFS) {
    await prisma.weightReference.upsert({
      where: { category_label: { category: ref.category, label: ref.label } },
      update: {
        actualWeightGrams: ref.actualWeightGrams,
        chargeableWeightGrams: ref.chargeableWeightGrams,
        isNamedProduct: true
      },
      create: {
        category: ref.category,
        label: ref.label,
        actualWeightGrams: ref.actualWeightGrams,
        chargeableWeightGrams: ref.chargeableWeightGrams,
        isNamedProduct: true
      }
    });
    seeded++;
  }
  console.log(`Seeded ${seeded} weight references.`);
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

  // Seed default shipping rate: NGN 800 per kg
  await prisma.appSetting.upsert({
    where: { key: 'shipping_rate_per_kg_ngn' },
    update: {},
    create: { key: 'shipping_rate_per_kg_ngn', value: '800' }
  });
}

async function main() {
  await seedAdaptersAndSettings();
  await seedWeightReferences();

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
