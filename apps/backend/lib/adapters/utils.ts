export function coerceString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

export function parseAvailability(value: unknown) {
  if (!value) return null;
  const raw = typeof value === 'string' ? value : (value as any)?.url;
  if (typeof raw !== 'string') return null;
  const normalized = raw.toLowerCase();
  if (normalized.includes('instock')) return true;
  if (normalized.includes('outofstock') || normalized.includes('soldout')) return false;
  return null;
}
