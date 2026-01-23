import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { signupSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { createSession, getClientCookieName, hashPassword } from '../../../../../lib/auth';
import { sendMail } from '../../../../../lib/mailer';

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

  await sendMail({
    to: user.email,
    subject: 'Welcome to UK2MeOnline',
    text: `Hi ${user.name ?? 'there'}, your UK2MeOnline account is ready.`
  });

  const session = await createSession(user.id);
  const response = ok({
    user: { id: user.id, email: user.email, name: user.name }
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
