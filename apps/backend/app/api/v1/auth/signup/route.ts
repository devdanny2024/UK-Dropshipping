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

  const displayName = user.name ?? 'there';
  const welcomeHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f2ee; padding: 32px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ece8e2;">
        <div style="padding: 24px 28px; background: linear-gradient(135deg, #111827, #1f2937); color: #f9fafb;">
          <div style="font-size: 20px; letter-spacing: 2px; font-weight: 600;">UK2ME ONLINE</div>
          <div style="margin-top: 8px; font-size: 28px; font-weight: 700;">Welcome aboard, ${displayName}!</div>
          <div style="margin-top: 8px; font-size: 14px; color: #d1d5db;">
            Your UK2ME Store account is live and ready for shopping.
          </div>
        </div>
        <div style="padding: 28px; color: #111827;">
          <div style="font-size: 16px; font-weight: 600;">Here’s what you can do next:</div>
          <ul style="padding-left: 18px; margin: 12px 0 0 0; color: #4b5563; line-height: 1.6;">
            <li>Paste any UK or USA product link and get a quote instantly.</li>
            <li>Track your order from purchase to delivery.</li>
            <li>Save addresses for lightning-fast checkout.</li>
          </ul>
          <div style="margin-top: 22px;">
            <a href="https://uk-dropshipping-client.vercel.app/"
              style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
              Start shopping now
            </a>
          </div>
        </div>
        <div style="padding: 18px 28px; background: #f9fafb; color: #6b7280; font-size: 12px;">
          If you did not create this account, reply to this email and we will secure it immediately.
        </div>
      </div>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: 'Welcome to UK2MeOnline',
    text: `Hi ${displayName}, your UK2MeOnline account is ready.`,
    html: welcomeHtml
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
