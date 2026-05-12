import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { createSession, getClientCookieName } from '../../../../../lib/auth';

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string;
  name?: string;
  picture?: string;
  aud: string;
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) return null;
    return res.json() as Promise<GoogleTokenInfo>;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;
  if (!idToken || typeof idToken !== 'string') {
    return fail('INVALID_INPUT', 'idToken is required', 400);
  }

  const info = await verifyGoogleToken(idToken);
  if (!info || !info.sub || !info.email) {
    return fail('INVALID_TOKEN', 'Google token verification failed', 401);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && info.aud !== clientId) {
    return fail('INVALID_TOKEN', 'Token audience mismatch', 401);
  }

  if (info.email_verified !== 'true') {
    return fail('EMAIL_NOT_VERIFIED', 'Google account email is not verified', 403);
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: info.sub }, { email: info.email.toLowerCase() }] }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: info.email.toLowerCase(),
        name: info.name ?? null,
        googleId: info.sub,
        emailVerifiedAt: new Date(),
      }
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: info.sub,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      }
    });
  }

  const session = await createSession(user.id);
  const response = ok({ user: { id: user.id, email: user.email, name: user.name } });

  response.cookies.set(getClientCookieName(), session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: session.expiresAt
  });

  return response;
}
