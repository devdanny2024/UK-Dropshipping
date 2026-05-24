'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { StatusBadge } from '@/app/components/StatusBadge';
import { AccountShell } from '@/app/components/AccountShell';
import { useCurrency } from '@/app/hooks/use-currency';

type OrderEvent = { id: string; type: string; message: string; createdAt: string };
type Shipment = { id: string; carrier: string; trackingNumber: string; status: string };
type OrderDetail = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  items: Array<{
    id: string;
    qty: number;
    size: string;
    color: string;
    unitPrice: number;
    productSnapshot?: { title?: string; url?: string; imageUrl?: string };
  }>;
  events: OrderEvent[];
  shipments: Shipment[];
};

export default function ClientTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawId) return;
    fetch(`/api/proxy/v1/orders/${rawId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok) setOrder(payload.data);
        else setError(payload?.error?.message ?? 'Order not found');
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [rawId]);

  if (loading) {
    return (
      <AccountShell title="Orders">
        <p className="text-sm text-muted-foreground py-8 text-center">Loading order...</p>
      </AccountShell>
    );
  }

  if (error || !order) {
    return (
      <AccountShell title="Orders">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-sm text-destructive">{error ?? 'Order not found'}</p>
          <Button variant="outline" onClick={() => router.push('/orders')}>Back to Orders</Button>
        </div>
      </AccountShell>
    );
  }

  const firstItem = order.items[0];
  const { formatAmount } = useCurrency();

  return (
    <AccountShell title="Orders">
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.push('/orders')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{firstItem?.productSnapshot?.title ?? 'Order'}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">{order.id}</div>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Total Paid</div>
                <div className="font-medium">{formatAmount(order.total, order.currency)}</div>
              </div>
              {firstItem && (
                <div>
                  <div className="text-sm text-muted-foreground">Variant</div>
                  <div className="font-medium">{firstItem.size} / {firstItem.color} × {firstItem.qty}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Placed</div>
                <div className="font-medium">{new Date(order.createdAt).toLocaleString('en-GB')}</div>
              </div>
            </div>

            {order.events.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                <div className="space-y-4">
                  {order.events.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <div className="font-medium text-sm">{event.type}</div>
                        <div className="text-sm text-muted-foreground">{event.message}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(event.createdAt).toLocaleString('en-GB')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.shipments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Shipment</h3>
                {order.shipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div>
                      <div className="font-medium">{shipment.carrier}</div>
                      <div className="font-mono text-muted-foreground text-xs">{shipment.trackingNumber}</div>
                    </div>
                    <StatusBadge status={shipment.status} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Need help?</div>
                  <div className="text-sm text-muted-foreground">Chat with our ops team.</div>
                </div>
              </div>
              <Button variant="outline">Start Chat</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AccountShell>
  );
}
