import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { getFxRates } from '../../../../../lib/fx';

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

  const payload = await getFxRates(base, symbols);
  return ok(payload);
}
