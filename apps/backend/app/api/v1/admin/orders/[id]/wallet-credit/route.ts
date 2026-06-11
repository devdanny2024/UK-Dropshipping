import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../../lib/response';
import { parseBody } from '../../../../../../../lib/parse';
import { prisma } from '../../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../../lib/auth';
import { createOrderEvent } from '../../../../../../../lib/events';
import { sendMail } from '../../../../../../../lib/mailer';
import { walletCreditedEmail } from '../../../../../../../lib/emails';
import { credit, getBalances } from '../../../../../../../lib/wallet';

const walletCreditSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1).optional(),
  reason: z.string().min(1).optional()
});

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, walletCreditSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: context.params.id },
    include: { user: true }
  });
  if (!order) return fail('NOT_FOUND', 'Order not found', 404);
  if (!order.userId || !order.user) {
    return fail('NO_USER', 'Order has no associated user to credit', 400);
  }

  const currency = data.currency ?? order.currency;
  const reason = data.reason ?? `out_of_stock:${order.id}`;

  const txn = await credit(order.userId, data.amount, currency, reason, {
    orderId: order.id
  });

  await createOrderEvent(
    order.id,
    'wallet_credit',
    `Credited ${currency} ${data.amount.toFixed(2)} to customer wallet (${reason})`
  );

  if (order.user.email) {
    const mail = walletCreditedEmail(order.user.name ?? '', data.amount, currency, reason);
    await sendMail({ to: order.user.email, ...mail });
  }

  const balances = await getBalances(order.userId);

  return ok({ transaction: txn, balances });
}
