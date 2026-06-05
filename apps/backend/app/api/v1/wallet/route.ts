import type { NextRequest } from 'next/server';
import { ok } from '../../../../lib/response';
import { prisma } from '../../../../lib/prisma';
import { requireClient, getClientSession } from '../../../../lib/auth';
import { getBalances, getOrCreateWallet } from '../../../../lib/wallet';

export async function GET(request: NextRequest) {
  const authError = await requireClient(request);
  if (authError) return authError;

  const session = await getClientSession(request);
  if (!session) return ok({ balances: {}, transactions: [] });

  const wallet = await getOrCreateWallet(session.userId);
  const balances = await getBalances(session.userId);
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' }
  });

  return ok({ balances, transactions });
}
