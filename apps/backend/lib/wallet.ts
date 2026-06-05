import { prisma } from './prisma';
import type { Wallet, WalletTransaction } from '@prisma/client';

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
