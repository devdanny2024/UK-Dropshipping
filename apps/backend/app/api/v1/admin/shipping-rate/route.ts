import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { shippingRateSchema } from '../../../../../lib/schemas';
import { requireAdmin } from '../../../../../lib/auth';
import { getShippingRatePerKgNgn, setShippingRatePerKgNgn } from '../../../../../lib/settings';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const rate = await getShippingRatePerKgNgn();
  return ok({ ratePerKgNgn: rate });
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, shippingRateSchema);
  if (error) return error;

  await setShippingRatePerKgNgn(data.ratePerKgNgn);
  return ok({ ratePerKgNgn: data.ratePerKgNgn });
}
