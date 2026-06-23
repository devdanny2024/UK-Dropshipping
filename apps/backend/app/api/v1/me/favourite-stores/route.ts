import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { getClientSession } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const items = await prisma.orderItem.findMany({
    where: { order: { userId: session.userId } },
    include: { productSnapshot: { select: { url: true, title: true, imageUrl: true } } },
  });

  const storeMap = new Map<string, { domain: string; orderCount: number; lastTitle: string | null; lastImage: string | null }>();

  for (const item of items) {
    const url = item.productSnapshot?.url;
    if (!url) continue;
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      const existing = storeMap.get(domain);
      if (existing) {
        existing.orderCount += 1;
      } else {
        storeMap.set(domain, {
          domain,
          orderCount: 1,
          lastTitle: item.productSnapshot?.title ?? null,
          lastImage: item.productSnapshot?.imageUrl ?? null,
        });
      }
    } catch {
      continue;
    }
  }

  const stores = Array.from(storeMap.values()).sort((a, b) => b.orderCount - a.orderCount);

  return ok({ stores });
}
