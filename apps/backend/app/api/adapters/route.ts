import type { NextRequest } from 'next/server';
import { ok } from '../../../lib/response';
import { STORE_ADAPTERS } from '../../../lib/store-adapters';

export async function GET(_request: NextRequest) {
  // For now we just return static metadata for configured adapters.
  // In the future this can be extended with real health checks per store.
  return ok({
    adapters: STORE_ADAPTERS.map((store) => ({
      id: store.id,
      name: store.name,
      domain: store.domain,
      status: 'online'
    }))
  });
}

