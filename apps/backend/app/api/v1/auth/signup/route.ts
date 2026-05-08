import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { signupSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { createSession, generateToken, getClientCookieName, hashPassword } from '../../../../../lib/auth';
import { sendMail } from '../../../../../lib/mailer';
import { welcomeVerificationEmail } from '../../../../../lib/emails';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, signupSchema);
  if (error) return error;

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });

  if (existing) {
    return fail('EMAIL_EXISTS', 'Email is already registered', 409);
  }

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: hashPassword(data.password)
    }
  });

  const verificationToken = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  const mail = welcomeVerificationEmail(user.name ?? '', verificationToken);
  await sendMail({ to: user.email, ...mail });

  const session = await createSession(user.id);
  const response = ok({
    user: { id: user.id, email: user.email, name: user.name },
    verificationRequired: true
  });

  response.cookies.set(getClientCookieName(), session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: session.expiresAt
  });

  return response;
}
