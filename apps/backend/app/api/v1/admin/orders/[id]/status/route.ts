import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../../lib/response';
import { parseBody } from '../../../../../../../lib/parse';
import { updateOrderStatusSchema } from '../../../../../../../lib/schemas';
import { prisma } from '../../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../../lib/events';
import { requireAdmin } from '../../../../../../../lib/auth';
import { sendMail } from '../../../../../../../lib/mailer';
import { orderStatusEmail } from '../../../../../../../lib/emails';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const { data, error } = await parseBody(request, updateOrderStatusSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true, name: true } } }
  });
  if (!order) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: data.status }
  });

  await createOrderEvent(updated.id, 'STATUS', data.note ?? `Status updated to ${data.status}`);

  if (order.user?.email) {
    const mail = orderStatusEmail(order.user.name ?? '', params.id, data.status, data.note);
    if (mail) await sendMail({ to: order.user.email, ...mail });
  }

  return ok({ id: updated.id, status: updated.status });
}
