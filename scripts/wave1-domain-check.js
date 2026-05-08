const storeList = require('../packages/shared/src/store-list.json');
const overrides = require('../packages/shared/src/store-overrides.json');

function normalizeName(name) {
  return name.toLowerCase().trim();
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferDomain(name, region) {
  const normalized = normalizeName(name);

  const override = overrides[normalized];
  if (override) return override;

  if (normalized.includes('.')) {
    return normalized.replace(/^www\./, '');
  }

  const tld = region === 'US' ? 'com' : 'co.uk';
  return `${slugify(name)}.${tld}`;
}

const targets = ['H.Samuel', 'NEXT', 'Currys', 'Argos', 'Pandora UK', 'Louis Vuitton', 'Gucci'];
const rows = [];

for (const category of storeList) {
  for (const segment of category.segments) {
    const region = segment.label.toLowerCase().includes('us') ? 'US' : 'UK';
    for (const store of segment.stores) {
      if (targets.includes(store)) {
        rows.push({ store, domain: inferDomain(store, region), region });
      }
    }
  }
}

rows.sort((a, b) => a.store.localeCompare(b.store));
console.log(rows);
