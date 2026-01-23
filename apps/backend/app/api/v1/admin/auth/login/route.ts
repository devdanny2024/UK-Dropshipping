import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { adminLoginSchema } from '../../../../../../lib/schemas';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, adminLoginSchema);
  if (error) return error;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return fail('ADMIN_CONFIG_MISSING', 'Admin credentials not configured', 500);
  }

  if (data.email.toLowerCase() !== adminEmail.toLowerCase() || data.password !== adminPassword) {
    return fail('INVALID_CREDENTIALS', 'Invalid admin credentials', 401);
  }

  const cookieName = process.env.ADMIN_SESSION_COOKIE ?? 'admin_session';
  const response = ok({ ok: true, email: adminEmail });
  response.cookies.set(cookieName, 'active', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return response;
}
