import type { NextRequest } from 'next/server';
import { ok } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { platformFeeSchema } from '../../../../../../lib/schemas';
import { requireAdmin } from '../../../../../../lib/auth';
import { getPlatformFeePercent, setPlatformFeePercent } from '../../../../../../lib/settings';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const feePercent = await getPlatformFeePercent();
  return ok({ feePercent });
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, platformFeeSchema);
  if (error) return error;

  await setPlatformFeePercent(data.feePercent);
  return ok({ feePercent: data.feePercent });
}
