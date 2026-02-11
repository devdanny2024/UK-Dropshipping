import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { prisma } from '../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../lib/auth';
import { checkAdapterDomain } from '../../../../../../lib/adapters-state';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const adapter = await prisma.adapterState.findUnique({ where: { id: params.id } });
  if (!adapter) return fail('NOT_FOUND', 'Adapter not found', 404);

  const result = await checkAdapterDomain(adapter.domain);
  const updated = await prisma.adapterState.update({
    where: { id: adapter.id },
    data: {
      status: result.status,
      notes: result.notes,
      lastCheckAt: new Date()
    }
  });

  return ok({ adapter: updated });
}
