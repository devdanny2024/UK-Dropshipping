import type { NextRequest } from 'next/server';
import { ok } from '../../../../lib/response';
import { ensureAdapterStatesSeeded } from '../../../../lib/adapters-state';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  await ensureAdapterStatesSeeded();
  const adapters = await prisma.adapterState.findMany({ orderBy: [{ name: 'asc' }] });

  return ok({ adapters });
}
