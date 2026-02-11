const fs = require('fs');
const path = require('path');

const storeListPath = path.join(__dirname, '..', 'packages', 'shared', 'src', 'store-list.json');
const overridesPath = path.join(__dirname, '..', 'packages', 'shared', 'src', 'store-overrides.json');

const DOMAIN_OVERRIDES = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));

function normalizeName(name) {
  return name.toLowerCase().trim();
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferDomain(name, region) {
  const normalized = normalizeName(name);

  const override = DOMAIN_OVERRIDES[normalized];
  if (override) return override;

  if (normalized.includes('.')) {
    return normalized.replace(/^www\./, '');
  }

  const tld = region === 'US' ? 'com' : 'co.uk';
  return `${slugify(name)}.${tld}`;
}

function loadStoreList() {
  const raw = fs.readFileSync(storeListPath, 'utf8');
  return JSON.parse(raw);
}

function buildDomainList() {
  const categories = loadStoreList();
  const entries = [];

  for (const category of categories) {
    for (const segment of category.segments) {
      const region = segment.label.toLowerCase().includes('us') ? 'US' : 'UK';
      for (const store of segment.stores) {
        entries.push({
          name: store,
          region,
          domain: inferDomain(store, region)
        });
      }
    }
  }

  return entries;
}

function printDuplicates(entries) {
  const map = new Map();
  for (const entry of entries) {
    const list = map.get(entry.domain) || [];
    list.push(entry);
    map.set(entry.domain, list);
  }

  const duplicates = Array.from(map.entries()).filter(([, list]) => list.length > 1);
  if (!duplicates.length) return;

  console.log('\nDuplicate domains detected:\n');
  for (const [domain, list] of duplicates) {
    console.log(`- ${domain}: ${list.map((item) => item.name).join(', ')}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const outPath = outIndex !== -1 ? args[outIndex + 1] : null;

  const entries = buildDomainList();
  const unique = Array.from(
    new Map(entries.map((entry) => [entry.domain, entry])).values()
  ).sort((a, b) => a.domain.localeCompare(b.domain));

  console.log(`Stores: ${entries.length}`);
  console.log(`Unique domains: ${unique.length}`);
  printDuplicates(entries);

  if (outPath) {
    const output = {
      generatedAt: new Date().toISOString(),
      totalStores: entries.length,
      uniqueDomains: unique.length,
      stores: unique
    };
    const fullPath = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(output, null, 2));
    console.log(`\nWrote ${unique.length} domains to ${fullPath}`);
  }
}

main();
