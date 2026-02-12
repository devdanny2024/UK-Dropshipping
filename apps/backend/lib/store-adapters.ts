import { partnerStoreCategories, storeDomainOverrides } from '@uk2me/shared';

type StoreRegion = 'UK' | 'US';

type StoreSeed = {
  name: string;
  region: StoreRegion;
};

type StoreAdapter = {
  id: string;
  name: string;
  domain: string;
  region: StoreRegion;
};

const STORE_SEEDS: StoreSeed[] = partnerStoreCategories.flatMap((category) =>
  category.segments.flatMap((segment) => {
    const region = segment.label.toLowerCase().includes('us') ? 'US' : 'UK';
    return segment.stores.map((store) => ({
      name: store,
      region
    }));
  })
);

const DOMAIN_OVERRIDES: Record<string, string> = storeDomainOverrides;

function normalizeName(name: string) {
  return name.toLowerCase().trim();
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferDomain(name: string, region: StoreRegion) {
  const normalized = normalizeName(name);

  // Always honor explicit overrides first (important for dotted names like "H.Samuel").
  const override = DOMAIN_OVERRIDES[normalized];
  if (override) return override;

  if (normalized.includes('.')) {
    return normalized.replace(/^www\./, '');
  }

  const tld = region === 'UK' ? 'co.uk' : 'com';
  return `${slugify(name)}.${tld}`;
}

export const STORE_ADAPTERS: StoreAdapter[] = Array.from(
  new Map(
    STORE_SEEDS.map((store) => {
      const domain = inferDomain(store.name, store.region);
      return [domain, {
        id: domain,
        name: store.name,
        domain,
        region: store.region
      }];
    })
  ).values()
);
