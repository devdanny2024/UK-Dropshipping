import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { magicRequestSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { sendMail } from '../../../../../lib/mailer';
import { magicLoginCodeEmail } from '../../../../../lib/emails';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, magicRequestSchema);
  if (error) return error;

  const email = data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return ok({ sent: true });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));

  await prisma.magicLoginCode.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  const mail = magicLoginCodeEmail(email, code);
  await sendMail({ to: email, ...mail });

  return ok({ sent: true });
}
