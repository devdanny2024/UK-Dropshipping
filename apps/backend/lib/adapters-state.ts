import { prisma } from './prisma';
import { STORE_ADAPTERS } from './store-adapters';

export function normalizeDomain(input: string) {
  return input.toLowerCase().trim().replace(/^www\./, '');
}

function getDomainCandidates(hostname: string) {
  const normalized = normalizeDomain(hostname);
  const parts = normalized.split('.').filter(Boolean);

  const candidates = new Set<string>();
  candidates.add(normalized);

  // Common mobile subdomain.
  candidates.add(normalized.replace(/^m\./, ''));

  // Also try parent domains so locale subdomains like uk.louisvuitton.com match louisvuitton.com.
  if (parts.length >= 3) {
    candidates.add(parts.slice(-2).join('.'));
    candidates.add(parts.slice(-3).join('.'));
  }

  return Array.from(candidates).filter(Boolean);
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
  const hostname = new URL(url).hostname;
  const candidates = getDomainCandidates(hostname);

  return prisma.adapterState.findFirst({
    where: {
      OR: candidates.map((domain) => ({ domain }))
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
