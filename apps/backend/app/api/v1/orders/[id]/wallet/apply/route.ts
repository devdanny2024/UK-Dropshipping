import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../../lib/response';
import { getClientSession } from '../../../../../../../lib/auth';
import { prisma } from '../../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../../lib/events';
import { sendMail } from '../../../../../../../lib/mailer';
import { paymentConfirmedEmail } from '../../../../../../../lib/emails';
import { getBalances, getPaidAmount, applyWalletToOrder } from '../../../../../../../lib/wallet';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * M3 R13 — apply the customer's wallet credit (same currency) to an order.
 * Amounts are computed and enforced server-side: we charge at most the order's
 * outstanding balance and at most the wallet balance. If the credit fully
 * covers the order, it is marked paid here; otherwise the remainder is settled
 * through the normal gateway/simulate flow (which also reads the outstanding).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Please log in', 401);

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { invoice: true }
  });
  if (!order || order.userId !== session.userId) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }
  if (order.status !== 'PLACED') {
    return fail('ORDER_NOT_PAYABLE', 'This order can no longer be paid', 409);
  }

  const currency = order.currency;
  const paid = await getPaidAmount(order.id);
  const outstanding = round2(Math.max(0, order.total - paid));
  if (outstanding <= 0) {
    return ok({ applied: 0, outstanding: 0, orderPaid: true, currency });
  }

  const balances = await getBalances(session.userId);
  const balance = balances[currency] ?? 0;
  if (balance <= 0) {
    return fail('NO_CREDIT', `No ${currency} wallet credit available`, 400);
  }

  const applied = await applyWalletToOrder({
    userId: session.userId,
    orderId: order.id,
    currency,
    amount: outstanding
  });
  if (applied <= 0) {
    return fail('NO_CREDIT', 'Could not apply wallet credit', 400);
  }

  const newOutstanding = round2(Math.max(0, outstanding - applied));
  const orderPaid = newOutstanding <= 0;

  await createOrderEvent(
    order.id,
    'PAYMENT',
    `Wallet credit ${currency} ${applied.toFixed(2)} applied` +
      (orderPaid ? ' — order fully covered' : `; ${currency} ${newOutstanding.toFixed(2)} remaining`)
  );

  if (orderPaid) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } });
    if (order.invoice) {
      await prisma.invoice.update({
        where: { id: order.invoice.id },
        data: { status: 'PAID', paidAt: new Date() }
      });
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user?.email) {
      const mail = paymentConfirmedEmail(user.name ?? '', order.id, order.total, currency, 'wallet');
      await sendMail({ to: user.email, ...mail });
    }
  }

  return ok({ applied, outstanding: newOutstanding, orderPaid, currency });
}
