import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { getFxRates } from '../../../../lib/fx';
import { getAllFxOverrides } from '../../../../lib/settings';

export async function GET(request: NextRequest) {
  const base = (request.nextUrl.searchParams.get('base') ?? 'GBP').toUpperCase();
  const symbolsParam = request.nextUrl.searchParams.get('symbols') ?? 'USD,NGN';
  const symbols = symbolsParam
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return fail('INVALID_SYMBOLS', 'At least one symbol is required', 400);
  }

  const [liveData, overrides] = await Promise.all([
    getFxRates(base, symbols),
    getAllFxOverrides()
  ]);

  const rates = { ...liveData.rates };
  for (const symbol of symbols) {
    const pair = `${base}_${symbol}`;
    if (overrides[pair] !== undefined) {
      rates[symbol] = overrides[pair];
    }
  }

  return ok({ base, rates, updatedAt: liveData.updatedAt, hasOverrides: Object.keys(overrides).length > 0 });
}
