import type { NextRequest } from 'next/server';
import { ok } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { weightReferenceSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const category = request.nextUrl.searchParams.get('category') ?? undefined;
  const isNamedProduct = request.nextUrl.searchParams.get('isNamedProduct');

  const refs = await prisma.weightReference.findMany({
    where: {
      category: category ? { equals: category, mode: 'insensitive' } : undefined,
      isNamedProduct: isNamedProduct !== null ? isNamedProduct === 'true' : undefined
    },
    orderBy: [{ category: 'asc' }, { label: 'asc' }]
  });

  return ok({ weightReferences: refs });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, weightReferenceSchema);
  if (error) return error;

  const ref = await prisma.weightReference.upsert({
    where: { category_label: { category: data.category, label: data.label } },
    update: {
      actualWeightGrams: data.actualWeightGrams,
      chargeableWeightGrams: data.chargeableWeightGrams,
      isNamedProduct: data.isNamedProduct ?? false,
      notes: data.notes
    },
    create: {
      category: data.category,
      label: data.label,
      actualWeightGrams: data.actualWeightGrams,
      chargeableWeightGrams: data.chargeableWeightGrams,
      isNamedProduct: data.isNamedProduct ?? false,
      notes: data.notes
    }
  });

  return ok({ weightReference: ref });
}
