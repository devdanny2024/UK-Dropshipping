import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { fail } from './response';
import { prisma } from './prisma';

export function requireAdmin(request: NextRequest) {
  const cookieName = process.env.ADMIN_SESSION_COOKIE ?? 'admin_session';
  const session = request.cookies.get(cookieName)?.value;
  if (session !== 'active') {
    return fail('UNAUTHORIZED', 'Admin session required', 401);
  }
  return null;
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
