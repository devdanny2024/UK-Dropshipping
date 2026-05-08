import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { forgotPasswordSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { generateToken } from '../../../../../lib/auth';
import { sendMail } from '../../../../../lib/mailer';
import { forgotPasswordEmail } from '../../../../../lib/emails';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, forgotPasswordSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) {
    return ok({ sent: true });
  }

  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  const mail = forgotPasswordEmail(user.name ?? '', token);
  await sendMail({ to: user.email, ...mail });

  return ok({ sent: true });
}
