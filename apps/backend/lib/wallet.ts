import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import type { Wallet, WalletTransaction } from '@prisma/client';

/** Thrown when a concurrent/duplicate wallet apply hits the unique key. */
export class WalletApplyConflict extends Error {
  constructor() {
    super('Wallet credit is already being applied to this order');
    this.name = 'WalletApplyConflict';
  }
}

export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { userId } });
}

export async function getBalances(userId: string): Promise<Record<string, number>> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return {};

  const txns = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id }
  });

  const balances: Record<string, number> = {};
  for (const txn of txns) {
    const delta = txn.type === 'CREDIT' ? txn.amount : -txn.amount;
    balances[txn.currency] = (balances[txn.currency] ?? 0) + delta;
  }
  return balances;
}

export async function credit(
  userId: string,
  amount: number,
  currency: string,
  reason: string,
  opts?: { orderId?: string; createdById?: string }
): Promise<WalletTransaction> {
  if (!(amount > 0)) {
    throw new Error('Credit amount must be greater than 0');
  }

  const wallet = await getOrCreateWallet(userId);

  return prisma.$transaction(async (tx) => {
    const prior = await tx.walletTransaction.findMany({
      where: { walletId: wallet.id, currency }
    });
    const currentBalance = prior.reduce(
      (sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount),
      0
    );
    const balanceAfter = currentBalance + amount;

    return tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        currency,
        reason,
        orderId: opts?.orderId,
        createdById: opts?.createdById,
        balanceAfter
      }
    });
  });
}

/**
 * Sum of settled payments (RECEIVED | CAPTURED) recorded against an order.
 * Currency-aware: when `currency` is supplied (the order currency), only
 * payments in that same currency are counted. This prevents mixing, e.g.,
 * an NGN Paystack capture into a GBP order total, which would otherwise
 * produce a nonsensical "paid" figure.
 */
export async function getPaidAmount(orderId: string, currency?: string): Promise<number> {
  const rows = await prisma.payment.findMany({
    where: {
      orderId,
      status: { in: ['RECEIVED', 'CAPTURED'] },
      ...(currency ? { currency } : {})
    },
    select: { amount: true }
  });
  return rows.reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Apply wallet credit to an order — debit the wallet and record a
 * `Payment{provider:"wallet"}`, atomically. The balance is re-read inside the
 * transaction and the debit is capped to it, so a stale/oversized `amount` can
 * never overdraw the wallet. Returns the amount actually applied (may be 0).
 * Order-state transitions are left to the caller.
 */
export async function applyWalletToOrder(params: {
  userId: string;
  orderId: string;
  currency: string;
  amount: number;
}): Promise<number> {
  const { userId, orderId, currency, amount } = params;
  if (!(amount > 0)) return 0;

  const wallet = await getOrCreateWallet(userId);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const prior = await tx.walletTransaction.findMany({
          where: { walletId: wallet.id, currency }
        });
        const balance = prior.reduce(
          (sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount),
          0
        );
        const apply = Math.min(amount, balance);
        if (!(apply > 0)) return 0;

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'DEBIT',
            amount: apply,
            currency,
            reason: `order:${orderId}`,
            orderId,
            balanceAfter: balance - apply
          }
        });

        // Deterministic idempotency key: a concurrent/duplicate apply for the
        // same order violates the @unique constraint and is rejected, so the
        // wallet can never be debited twice for one order.
        await tx.payment.create({
          data: {
            orderId,
            paymentRef: `WALLET-${orderId.slice(-8).toUpperCase()}`,
            provider: 'wallet',
            amount: apply,
            currency,
            status: 'CAPTURED',
            idempotencyKey: `wallet:${orderId}`,
            paidAt: new Date(),
            rawPayload: { walletDebit: true }
          }
        });

        return apply;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (err) {
    // Duplicate apply (deterministic key) or serialization failure — surface
    // a clean, retryable conflict instead of a 500.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === 'P2002' || err.code === 'P2034')
    ) {
      throw new WalletApplyConflict();
    }
    throw err;
  }
}

export async function debit(
  userId: string,
  amount: number,
  currency: string,
  reason: string,
  opts?: { orderId?: string; paymentId?: string }
): Promise<WalletTransaction> {
  if (!(amount > 0)) {
    throw new Error('Debit amount must be greater than 0');
  }

  const wallet = await getOrCreateWallet(userId);

  return prisma.$transaction(async (tx) => {
    const prior = await tx.walletTransaction.findMany({
      where: { walletId: wallet.id, currency }
    });
    const currentBalance = prior.reduce(
      (sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount),
      0
    );
    if (amount > currentBalance) {
      throw new Error(
        `Insufficient wallet balance: have ${currency} ${currentBalance.toFixed(2)}, need ${currency} ${amount.toFixed(2)}`
      );
    }
    const balanceAfter = currentBalance - amount;

    return tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        currency,
        reason,
        orderId: opts?.orderId,
        paymentId: opts?.paymentId,
        balanceAfter
      }
    });
  });
}
