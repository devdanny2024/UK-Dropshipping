import type { NextRequest } from 'next/server';
import { fail } from './response';

export function requireAdmin(request: NextRequest) {
  const cookieName = process.env.ADMIN_SESSION_COOKIE ?? 'admin_session';
  const session = request.cookies.get(cookieName)?.value;
  if (session !== 'active') {
    return fail('UNAUTHORIZED', 'Admin session required', 401);
  }
  return null;
}
