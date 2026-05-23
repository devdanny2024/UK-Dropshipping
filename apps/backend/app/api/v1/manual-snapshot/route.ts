import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const manualSnapshotSchema = z.object({
  url: z.string().url(),
  title: z.string().min(2),
  price: z.number().positive(),
  currency: z.string().default('GBP'),
  imageUrl: z.string().url().optional()
});

/**
 * POST /api/v1/manual-snapshot
 *
 * Creates a ProductSnapshot from manually entered details, used when the
 * automatic crawler fails to resolve the product page.
 */
export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, manualSnapshotSchema);
  if (error) return error;

  if (!data.url) {
    return fail('VALIDATION_ERROR', 'URL is required', 400);
  }

  const snapshot = await prisma.productSnapshot.create({
    data: {
      url: data.url,
      title: data.title,
      imageUrl: data.imageUrl ?? null,
      price: data.price,
      currency: data.currency ?? 'GBP',
      raw: { manual: true, enteredBy: 'user' }
    }
  });

  return ok({
    id: snapshot.id,
    url: snapshot.url,
    title: snapshot.title,
    imageUrl: snapshot.imageUrl,
    price: snapshot.price,
    currency: snapshot.currency,
    manual: true,
    createdAt: snapshot.createdAt.toISOString()
  });
}

export async function GET() {
  return fail('METHOD_NOT_ALLOWED', 'Use POST', 405);
}
