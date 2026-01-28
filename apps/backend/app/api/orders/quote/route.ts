import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { quoteRequestSchema } from '../../../../lib/schemas';
import { getClientSession } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const { data, error } = await parseBody(request, quoteRequestSchema);
  if (error) return error;

  const requestId = `REQ-${Date.now()}`;

  return ok({
    requestId,
    items: data.items,
    customItems: data.customItems ?? [],
    notes: data.notes ?? null
  });
}
