import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { resolveProductSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { resolveProductFromUrl } from '../../../../lib/adapters';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, resolveProductSchema);
  if (error) return error;

  const url = data.url;

  // Resolve product details synchronously so callers (admin/client) get
  // a usable snapshot immediately, without depending on the background worker.
  const resolved = await resolveProductFromUrl(url);

  const snapshot = await prisma.productSnapshot.create({
    data: {
      url,
      title: resolved.title,
      imageUrl: resolved.imageUrl,
      price: resolved.price ?? 0,
      currency: resolved.currency ?? 'GBP',
      raw: resolved.raw as any
    }
  });

  return ok({
    id: snapshot.id,
    url: snapshot.url,
    title: snapshot.title,
    imageUrl: snapshot.imageUrl,
    price: snapshot.price,
    currency: snapshot.currency,
    createdAt: snapshot.createdAt.toISOString()
  });
}

export async function GET() {
  return fail('METHOD_NOT_ALLOWED', 'Use POST', 405);
}
