'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { partnerStoreCategories, storeDomainOverrides } from '@uk2me/shared';

type Adapter = { domain: string; enabled: boolean; status: 'online' | 'offline' | 'unknown' };

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

export default function StoresPage() {
  const [query, setQuery] = useState('');
  const [adapters, setAdapters] = useState<Record<string, Adapter>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/adapters`, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (!payload?.ok) throw new Error(payload?.error?.message ?? 'Failed to load adapter status');
        const map: Record<string, Adapter> = {};
        for (const adapter of payload.data.adapters ?? []) {
          map[adapter.domain] = adapter;
        }
        setAdapters(map);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load status'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPartnerCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return partnerStoreCategories;

    return partnerStoreCategories
      .map((category) => ({
        ...category,
        segments: category.segments
          .map((segment) => ({
            ...segment,
            stores: segment.stores.filter((store) =>
              `${category.name} ${segment.label} ${store}`.toLowerCase().includes(normalized)
            )
          }))
          .filter((segment) => segment.stores.length > 0)
      }))
      .filter((category) => category.segments.length > 0);
  }, [query]);

  const resolveStoreDomain = (store: string) => {
    const normalized = store.trim().toLowerCase();
    const override = storeDomainOverrides[normalized];
    let domain = override ?? normalized;
    if (!override && !normalized.includes('.')) domain = `${normalized.replace(/[^a-z0-9]/g, '')}.com`;
    return domain.replace(/^www\./, '');
  };

  const getAdapterStatus = (store: string) => {
    const domain = resolveStoreDomain(store);
    return adapters[domain] ?? { domain, enabled: true, status: 'unknown' as const };
  };

  const buildPreviewUrl = (store: string) => `/preview?url=${encodeURIComponent(`https://${resolveStoreDomain(store)}/`)}`;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Store Adapters</h1>
          <p className="text-muted-foreground mt-2">Browse every partner store on UK2MeOnline with live adapter status.</p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading adapter health…</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stores..." className="pl-9" />
        </div>

        <div className="space-y-6">
          {filteredPartnerCategories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {category.segments.map((segment) => (
                  <div key={segment.label}>
                    <div className="text-sm font-semibold text-muted-foreground">{segment.label}</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {segment.stores.map((store) => {
                        const adapter = getAdapterStatus(store);
                        const online = adapter.enabled && adapter.status !== 'offline';
                        return (
                          <Link
                            key={store}
                            href={online ? buildPreviewUrl(store) : '#'}
                            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition hover:bg-muted/40"
                          >
                            <span className="font-medium text-foreground">{store}</span>
                            <Badge variant={online ? 'default' : 'secondary'}>{online ? 'Online' : 'Unavailable'}</Badge>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
