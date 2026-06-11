import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { requireAdmin } from '../../../../../lib/auth';
import { getFxRates } from '../../../../../lib/fx';
import { getAllFxOverrides, setFxOverride, deleteFxOverride } from '../../../../../lib/settings';
import { fxOverrideSchema } from '../../../../../lib/schemas';

const DEFAULT_PAIRS = [
  { base: 'GBP', symbols: ['USD', 'NGN'] },
  { base: 'USD', symbols: ['NGN'] }
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const [overrides, ...liveResults] = await Promise.all([
    getAllFxOverrides(),
    ...DEFAULT_PAIRS.map(({ base, symbols }) => getFxRates(base, symbols))
  ]);

  const live: Record<string, number> = {};
  for (const result of liveResults) {
    for (const [symbol, rate] of Object.entries(result.rates)) {
      live[`${result.base}_${symbol}`] = rate;
    }
  }

  return ok({ overrides, live });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const { data, error } = await parseBody(request, fxOverrideSchema);
  if (error) return error;

  await setFxOverride(data.pair, data.rate);
  return ok({ pair: data.pair.toUpperCase(), rate: data.rate });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const pair = request.nextUrl.searchParams.get('pair');
  if (!pair) return fail('BAD_REQUEST', 'pair query param required', 400);

  await deleteFxOverride(pair);
  return ok({ deleted: pair.toUpperCase() });
}
