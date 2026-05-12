import type { NextRequest } from 'next/server';
import { ok } from '../../../../../../lib/response';
import { requireAdmin } from '../../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return ok({ authenticated: true });
}
