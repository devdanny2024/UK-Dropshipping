import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { purchaseAttemptSchema } from '../../../../../../lib/schemas';
import { prisma } from '../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../lib/events';
import { purchaseAttemptQueue } from '../../../../../../lib/queue';
import { requireAdmin } from '../../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey) {
    return fail('MISSING_IDEMPOTENCY_KEY', 'Idempotency-Key header required', 400);
  }

  const existing = await prisma.purchaseAttempt.findUnique({
    where: { idempotencyKey }
  });

  if (existing) {
    return ok({ id: existing.id, status: existing.status });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  const { data, error } = await parseBody(request, purchaseAttemptSchema);
  if (error) return error;

  const attempt = await prisma.purchaseAttempt.create({
    data: {
      orderId: params.id,
      status: 'QUEUED',
      note: data.note ?? null,
      idempotencyKey
    }
  });

  await purchaseAttemptQueue.add('purchaseAttempt', { orderId: params.id, attemptId: attempt.id });
  await createOrderEvent(params.id, 'PURCHASE_ATTEMPT', 'Purchase attempt queued');

  return ok({ id: attempt.id, status: attempt.status });
}
