import type { NextRequest } from 'next/server';
import type { Role } from '@prisma/client';
import crypto from 'node:crypto';
import { fail } from './response';
import { prisma } from './prisma';

const ADMIN_COOKIE = process.env.ADMIN_SESSION_COOKIE ?? 'admin_session';

// Roles that may access the admin panel at all.
const ADMIN_ROLES: Role[] = ['STAFF', 'ADMIN', 'SUPER_ADMIN'];

// Ordered privilege ranking for requireRole(min) comparisons.
const ROLE_RANK: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export type AdminPrincipal = { userId: string; role: Role; email: string };

/**
 * Resolve the acting admin from the admin session cookie. Returns null when
 * there is no valid admin session (no/expired token, or the user is not an
 * admin-level role). Role is read live from the DB so promotions/demotions take
 * effect on the next request.
 */
export async function getAdminSession(request: NextRequest): Promise<AdminPrincipal | null> {
  // Local/dev escape hatch — preserves prior ADMIN_AUTH_DISABLED behaviour.
  if (process.env.ADMIN_AUTH_DISABLED === 'true') {
    return { userId: 'dev', role: 'SUPER_ADMIN', email: 'dev@local' };
  }
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  // 'active' was the legacy shared-cookie value — no longer a valid session.
  if (!token || token === 'active') return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (!ADMIN_ROLES.includes(session.user.role)) return null;
  return { userId: session.user.id, role: session.user.role, email: session.user.email };
}

export async function requireAdmin(request: NextRequest) {
  const principal = await getAdminSession(request);
  if (!principal) return fail('UNAUTHORIZED', 'Admin session required', 401);
  return null;
}

/**
 * Gate a route on a minimum role. Returns { error } to short-circuit, or
 * { principal } with the acting admin when authorised.
 */
export async function requireRole(
  request: NextRequest,
  min: Role
): Promise<{ error: ReturnType<typeof fail>; principal?: undefined } | { error?: undefined; principal: AdminPrincipal }> {
  const principal = await getAdminSession(request);
  if (!principal) return { error: fail('UNAUTHORIZED', 'Admin session required', 401) };
  if (ROLE_RANK[principal.role] < ROLE_RANK[min]) {
    return { error: fail('FORBIDDEN', `Requires ${min} role or higher`, 403) };
  }
  return { principal };
}

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function getAdminCookieName() {
  return ADMIN_COOKIE;
}

const CLIENT_COOKIE = process.env.CLIENT_SESSION_COOKIE ?? 'client_session';
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 24 * 7);

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, token, expiresAt }
  });
  return { token, expiresAt };
}

export function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

export async function getClientSession(request: NextRequest) {
  const token = request.cookies.get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  return session;
}

export async function requireClient(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }
  return null;
}

export function getClientCookieName() {
  return CLIENT_COOKIE;
}
