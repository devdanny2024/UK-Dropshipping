import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { getAdminSession } from '../../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const principal = await getAdminSession(request);
  if (!principal) return fail('UNAUTHORIZED', 'Admin session required', 401);
  return ok({ authenticated: true, email: principal.email, role: principal.role });
}
