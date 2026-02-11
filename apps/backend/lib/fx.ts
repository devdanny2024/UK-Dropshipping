type FxPayload = {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
};

const cache = new Map<string, { expiresAt: number; payload: FxPayload }>();
const lastKnown = new Map<string, FxPayload>();

const TTL_MS = Number(process.env.FX_CACHE_TTL_MS ?? 10 * 60 * 1000);

async function fetchFromPrimary(base: string, symbols: string[]) {
  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Primary FX failed (${response.status})`);
  const data = await response.json() as any;
  const rates: Record<string, number> = {};
  for (const symbol of symbols) {
    const rate = data?.rates?.[symbol];
    if (typeof rate === 'number') rates[symbol] = rate;
  }
  return rates;
}

async function fetchFromFallback(base: string, symbols: string[]) {
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fallback FX failed (${response.status})`);
  const data = await response.json() as any;
  return (data?.rates ?? {}) as Record<string, number>;
}

export async function getFxRates(base: string, symbols: string[]) {
  const normalizedBase = base.toUpperCase();
  const normalizedSymbols = symbols.map((symbol) => symbol.toUpperCase());
  const cacheKey = `${normalizedBase}:${normalizedSymbols.sort().join(',')}`;

  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.payload;

  let rates: Record<string, number> = {};
  try {
    rates = await fetchFromPrimary(normalizedBase, normalizedSymbols);
    if (Object.keys(rates).length === 0) {
      rates = await fetchFromFallback(normalizedBase, normalizedSymbols);
    }
  } catch {
    const fallback = lastKnown.get(cacheKey);
    if (fallback) return fallback;
    rates = await fetchFromFallback(normalizedBase, normalizedSymbols);
  }

  const payload: FxPayload = {
    base: normalizedBase,
    rates,
    updatedAt: new Date().toISOString()
  };

  cache.set(cacheKey, { payload, expiresAt: Date.now() + TTL_MS });
  lastKnown.set(cacheKey, payload);
  return payload;
}

export function convertAmount(amount: number, rate: number) {
  return Number((amount * rate).toFixed(2));
}
