import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { getClientSession } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  return ok({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    }
  });
}
