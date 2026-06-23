'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ExternalLink, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { AccountShell } from '@/app/components/AccountShell';

type FavouriteStore = {
  domain: string;
  orderCount: number;
  lastTitle: string | null;
  lastImage: string | null;
};

export default function FavouriteStoresPage() {
  const [stores, setStores] = useState<FavouriteStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/v1/me/favourite-stores', { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok) setStores(payload.data?.stores ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const displayName = (domain: string) => {
    const clean = domain.replace(/\.(com|co\.uk|org|net)$/i, '');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  return (
    <AccountShell title="My Favourite Stores">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" /> My Favourite Stores
          </CardTitle>
          <p className="text-sm text-muted-foreground">Based on where you shop most</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading your stores...</p>
          ) : stores.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No favourite stores yet. Place an order and your most-shopped stores will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {stores.map((store) => (
                <Link
                  key={store.domain}
                  href={`/preview?url=${encodeURIComponent(`https://${store.domain}/`)}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-4 transition hover:bg-muted/40"
                >
                  {store.lastImage ? (
                    <img src={store.lastImage} alt="" className="h-10 w-10 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{displayName(store.domain)}</div>
                    <div className="text-xs text-muted-foreground">{store.domain}</div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {store.orderCount} {store.orderCount === 1 ? 'order' : 'orders'}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AccountShell>
  );
}
