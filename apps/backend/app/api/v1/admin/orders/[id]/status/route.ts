import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../../lib/response';
import { parseBody } from '../../../../../../../lib/parse';
import { prisma } from '../../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../../lib/events';
import { requireAdmin } from '../../../../../../../lib/auth';
import { sendMail } from '../../../../../../../lib/mailer';
import { orderStatusEmail } from '../../../../../../../lib/emails';

// Full OrderStatus set (mirrors prisma OrderStatus enum). Defined locally so the
// /status endpoint validates against every lifecycle state, not a partial subset.
const ORDER_STATUSES = [
  'PLACED',
  'PENDING_INVOICE',
  'INVOICED',
  'PROCESSING',
  'AWAITING_PURCHASE',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

// Allowed current -> next transitions. Any order may be CANCELLED until it is
// already SHIPPED/DELIVERED. Forward-only otherwise (no skipping back).
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['PENDING_INVOICE', 'INVOICED', 'CANCELLED'],
  PENDING_INVOICE: ['INVOICED', 'CANCELLED'],
  INVOICED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['AWAITING_PURCHASE', 'SHIPPED', 'CANCELLED'],
  AWAITING_PURCHASE: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const { data, error } = await parseBody(request, statusSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true, name: true } } }
  });
  if (!order) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  const current = order.status as OrderStatus;
  const next = data.status;

  if (next !== current && !TRANSITIONS[current]?.includes(next)) {
    return fail('INVALID_TRANSITION', `Cannot change order from ${current} to ${next}`, 409);
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: next }
  });

  // Send the matching status email (some statuses have no customer copy → null).
  let attempted = false;
  let emailed = false;
  if (order.user?.email) {
    const mail = orderStatusEmail(order.user.name ?? '', params.id, next, data.note);
    if (mail) {
      attempted = true;
      const result = await sendMail({ to: order.user.email, ...mail });
      emailed = result.ok;
    }
  }

  const baseMessage = data.note ?? `Status updated to ${next}`;
  const message = attempted && !emailed ? `${baseMessage} (email not delivered)` : baseMessage;
  await createOrderEvent(updated.id, 'STATUS', message);

  return ok({ id: updated.id, status: updated.status });
}
