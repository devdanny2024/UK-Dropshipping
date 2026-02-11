import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { adapterUpdateSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, adapterUpdateSchema);
  if (error) return error;

  const existing = await prisma.adapterState.findUnique({ where: { id: params.id } });
  if (!existing) return fail('NOT_FOUND', 'Adapter not found', 404);

  const adapter = await prisma.adapterState.update({
    where: { id: params.id },
    data: {
      enabled: data.enabled,
      notes: data.notes
    }
  });

  return ok({ adapter });
}
