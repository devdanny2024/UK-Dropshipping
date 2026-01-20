import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { resolveProductSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { resolveProductQueue } from '../../../../lib/queue';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, resolveProductSchema);
  if (error) return error;

  const url = data.url;
  const title = `Snapshot for ${new URL(url).hostname}`;

  const snapshot = await prisma.productSnapshot.create({
    data: {
      url,
      title,
      imageUrl: null,
      price: 55.0,
      currency: 'GBP',
      raw: { source: 'mock' }
    }
  });

  await resolveProductQueue.add('resolveProduct', { snapshotId: snapshot.id, url });

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
