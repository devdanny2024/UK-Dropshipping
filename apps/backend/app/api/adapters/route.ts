import type { NextRequest } from 'next/server';
import { ok } from '../../../lib/response';
import { ensureAdapterStatesSeeded } from '../../../lib/adapters-state';
import { prisma } from '../../../lib/prisma';

export async function GET(_request: NextRequest) {
  await ensureAdapterStatesSeeded();
  const adapters = await prisma.adapterState.findMany({ orderBy: [{ name: 'asc' }] });

  return ok({
    adapters: adapters.map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
      domain: adapter.domain,
      enabled: adapter.enabled,
      status: adapter.status.toLowerCase(),
      lastCheckAt: adapter.lastCheckAt?.toISOString() ?? null
    }))
  });
}
