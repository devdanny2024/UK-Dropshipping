import { prisma } from './prisma';
import { STORE_ADAPTERS } from './store-adapters';

export function normalizeDomain(input: string) {
  return input.toLowerCase().replace(/^www\./, '').trim();
}

export async function ensureAdapterStatesSeeded() {
  for (const adapter of STORE_ADAPTERS) {
    await prisma.adapterState.upsert({
      where: { id: adapter.id },
      update: {
        name: adapter.name,
        domain: adapter.domain,
        region: adapter.region
      },
      create: {
        id: adapter.id,
        name: adapter.name,
        domain: adapter.domain,
        region: adapter.region,
        enabled: true,
        status: 'UNKNOWN'
      }
    });
  }
}

export async function findAdapterByUrl(url: string) {
  const hostname = normalizeDomain(new URL(url).hostname);
  return prisma.adapterState.findFirst({
    where: {
      OR: [
        { domain: hostname },
        { domain: `www.${hostname}` },
        { domain: hostname.replace(/^www\./, '') }
      ]
    }
  });
}

export async function checkAdapterDomain(domain: string) {
  const target = `https://${normalizeDomain(domain)}`;
  try {
    const response = await fetch(target, {
      method: 'HEAD',
      redirect: 'follow'
    });
    if (response.ok || response.status < 500) {
      return { status: 'ONLINE' as const, notes: `Reachable (${response.status})` };
    }
    return { status: 'OFFLINE' as const, notes: `Failed (${response.status})` };
  } catch (error) {
    return {
      status: 'OFFLINE' as const,
      notes: error instanceof Error ? error.message : 'Domain check failed'
    };
  }
}
