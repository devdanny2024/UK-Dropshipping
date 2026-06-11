import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../../../lib/response';
import { prisma } from '../../../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../../../lib/auth';
import { createOrderEvent } from '../../../../../../../../lib/events';
import { sendMail } from '../../../../../../../../lib/mailer';
import { invoiceReadyEmail } from '../../../../../../../../lib/emails';

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const orderId = context.params.id;

  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    include: { order: { include: { user: true } } },
  });
  if (!invoice) return fail('NOT_FOUND', 'Invoice not found', 404);

  const now = new Date();
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'SENT', sentAt: now },
    include: { lineItems: true },
  });

  await prisma.order.update({ where: { id: orderId }, data: { status: 'INVOICED' } });

  const user = invoice.order.user;
  let emailed = false;
  if (user?.email) {
    const m = invoiceReadyEmail(user.name ?? '', orderId, invoice.total, invoice.currency);
    const result = await sendMail({ to: user.email, subject: m.subject, html: m.html, text: m.text });
    emailed = result.ok;
  }

  await createOrderEvent(
    orderId,
    'INVOICE_SENT',
    `Invoice ${invoice.invoiceNumber} sent${emailed ? '' : ' (email not delivered)'}`,
  );

  return ok({ invoice: updated, emailed });
}
