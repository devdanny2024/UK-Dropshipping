import { ok } from '../../../../../../lib/response';

export async function POST() {
  const cookieName = process.env.ADMIN_SESSION_COOKIE ?? 'admin_session';
  const response = ok({ ok: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0)
  });
  return response;
}
