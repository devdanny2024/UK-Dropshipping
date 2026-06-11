import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { adminLoginSchema } from '../../../../../../lib/schemas';
import {
  createSession,
  hashPassword,
  verifyPassword,
  isAdminRole,
  getAdminCookieName,
} from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, adminLoginSchema);
  if (error) return error;

  const email = data.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });

  // Break-glass bootstrap: the env ADMIN_EMAIL/ADMIN_PASSWORD always work and
  // provision (or repair) the SUPER_ADMIN account, so the admin panel can never
  // be locked out even before any per-user admin exists in the database.
  const envEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  const isEnvSuperAdmin =
    !!envEmail && !!envPassword && email === envEmail && data.password === envPassword;

  if (isEnvSuperAdmin) {
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: 'Administrator',
          passwordHash: hashPassword(envPassword!),
          role: 'SUPER_ADMIN',
          emailVerifiedAt: new Date(),
        },
      });
    } else if (user.role !== 'SUPER_ADMIN' || !user.passwordHash) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'SUPER_ADMIN',
          passwordHash: user.passwordHash ?? hashPassword(envPassword!),
        },
      });
    }
  } else {
    // Normal per-user admin login: a real user with a password and an admin role.
    if (!user || !user.passwordHash || !verifyPassword(data.password, user.passwordHash)) {
      return fail('INVALID_CREDENTIALS', 'Invalid admin credentials', 401);
    }
    if (!isAdminRole(user.role)) {
      return fail('FORBIDDEN', 'This account does not have admin access', 403);
    }
  }

  const { token, expiresAt } = await createSession(user.id);
  const response = ok({ ok: true, email: user.email, role: user.role });
  response.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return response;
}
