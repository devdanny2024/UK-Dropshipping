import type { NextRequest } from 'next/server';
import { ok } from '../../../lib/response';

const UK_STORE_DOMAINS = [
  { name: 'ASOS', domain: 'asos.com' },
  { name: 'Zara', domain: 'zara.com' },
  { name: 'Amazon UK', domain: 'amazon.co.uk' },
  { name: 'Nike UK', domain: 'nike.com' },
  { name: 'H&M', domain: 'hm.com' }
];

export async function GET(_request: NextRequest) {
  // For now we just return static metadata for configured adapters.
  // In the future this can be extended with real health checks per store.
  return ok({
    adapters: UK_STORE_DOMAINS.map((store) => ({
      id: store.domain,
      name: store.name,
      domain: store.domain,
      status: 'online'
    }))
  });
}

