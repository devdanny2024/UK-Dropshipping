import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { resendVerificationSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { generateToken } from '../../../../../lib/auth';
import { sendMail } from '../../../../../lib/mailer';
import { resendVerificationEmail } from '../../../../../lib/emails';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, resendVerificationSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) {
    return ok({ sent: true });
  }

  if (user.emailVerifiedAt) {
    return ok({ verified: true });
  }

  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  const mail = resendVerificationEmail(user.name ?? '', token);
  await sendMail({ to: user.email, ...mail });

  return ok({ sent: true });
}
