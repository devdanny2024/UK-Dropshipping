'use client';

import { useState } from 'react';
import { Scale, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

export type WeightItem = {
  id: string;
  weightStatus?: string;
  productSnapshot?: { title?: string };
  size?: string;
  color?: string;
};

function flaggable(status?: string) {
  const s = (status ?? '').toUpperCase();
  return s === 'REQUESTED' || s === 'AUTO';
}

export function WeightPriceRequest({ orderId, items }: { orderId: string; items: WeightItem[] }) {
  // Only show for items that need (or can have) a weight price requested, plus
  // pending/priced states so the customer can follow the lifecycle.
  const relevant = items.filter((i) => {
    const s = (i.weightStatus ?? '').toUpperCase();
    return s === 'REQUESTED' || s === 'AUTO' || s === 'PENDING' || s === 'PRICED';
  });

  if (relevant.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" /> Weight-based pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {relevant.map((item) => (
          <WeightRow key={item.id} orderId={orderId} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

function WeightRow({ orderId, item }: { orderId: string; item: WeightItem }) {
  const initial = (item.weightStatus ?? '').toUpperCase();
  const [status, setStatus] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = item.productSnapshot?.title ?? 'Item';

  const request = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/orders/${orderId}/weight-price-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderItemIds: [item.id] }),
      });
      const payload = await res.json();
      if (!res.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message ?? 'Failed to request weight price');
      }
      setStatus('PENDING');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request weight price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{title}</div>
          {(item.size || item.color) && (
            <div className="text-xs text-muted-foreground">{[item.size, item.color].filter(Boolean).join(' / ')}</div>
          )}
        </div>

        {status === 'PRICED' ? (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium shrink-0">
            <CheckCircle2 className="h-4 w-4" /> Ready to pay
          </span>
        ) : status === 'PENDING' ? (
          <span className="flex items-center gap-1 text-sm text-amber-600 font-medium shrink-0">
            <Clock className="h-4 w-4" /> Price pending
          </span>
        ) : flaggable(status) ? (
          <Button size="sm" variant="outline" disabled={loading} onClick={request} className="gap-2 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            Request Weight Price
          </Button>
        ) : null}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
