import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { weightReferenceSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, weightReferenceSchema.partial());
  if (error) return error;

  const existing = await prisma.weightReference.findUnique({ where: { id: context.params.id } });
  if (!existing) return fail('NOT_FOUND', 'Weight reference not found', 404);

  const ref = await prisma.weightReference.update({
    where: { id: existing.id },
    data: {
      category: data.category ?? undefined,
      label: data.label ?? undefined,
      actualWeightGrams: data.actualWeightGrams ?? undefined,
      chargeableWeightGrams: data.chargeableWeightGrams ?? undefined,
      isNamedProduct: data.isNamedProduct ?? undefined,
      notes: data.notes ?? undefined
    }
  });

  return ok({ weightReference: ref });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const existing = await prisma.weightReference.findUnique({ where: { id: context.params.id } });
  if (!existing) return fail('NOT_FOUND', 'Weight reference not found', 404);

  await prisma.weightReference.delete({ where: { id: existing.id } });
  return ok({ deleted: true });
}
