import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { prisma } from '../../../../../../lib/prisma';
import { getClientSession } from '../../../../../../lib/auth';
import { createOrderEvent } from '../../../../../../lib/events';
import { sendMail } from '../../../../../../lib/mailer';
import { complaintOpenedEmail, complaintOpenedAdminEmail } from '../../../../../../lib/emails';

const complaintSchema = z.object({
  reason: z.string().min(1),
  detail: z.string().optional()
});

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Client session required', 401);

  const order = await prisma.order.findUnique({
    where: { id: context.params.id, userId: session.userId }
  });
  if (!order) return fail('NOT_FOUND', 'Order not found', 404);

  const { data, error } = await parseBody(request, complaintSchema);
  if (error) return error;

  const complaint = await prisma.complaint.create({
    data: {
      orderId: order.id,
      userId: session.userId,
      reason: data.reason,
      detail: data.detail,
      status: 'OPEN'
    }
  });

  await createOrderEvent(order.id, 'complaint_opened', `Customer raised a complaint: ${data.reason}`);

  if (session.user.email) {
    const mail = complaintOpenedEmail(session.user.name ?? '', order.id);
    await sendMail({ to: session.user.email, ...mail });
  }

  const adminEmail =
    process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '';
  if (adminEmail) {
    const adminMail = complaintOpenedAdminEmail(order.id, data.reason);
    await sendMail({ to: adminEmail, ...adminMail });
  }

  return ok({ complaint });
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Client session required', 401);

  const order = await prisma.order.findUnique({
    where: { id: context.params.id, userId: session.userId }
  });
  if (!order) return fail('NOT_FOUND', 'Order not found', 404);

  const complaints = await prisma.complaint.findMany({
    where: { orderId: order.id, userId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  return ok({ complaints });
}
