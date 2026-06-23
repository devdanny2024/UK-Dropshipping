'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { StatusBadge } from '@/app/components/StatusBadge';
import { AccountShell } from '@/app/components/AccountShell';
import { useCurrency } from '@/app/hooks/use-currency';

type OrderItem = {
  id: string;
  qty: number;
  size: string;
  color: string;
  unitPrice: number;
  total: number;
  title: string | null;
  imageUrl: string | null;
  url: string | null;
};

type Order = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  productTitle: string | null;
  productImage: string | null;
  items: OrderItem[];
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClientOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetch('/api/proxy/v1/orders', { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok) setOrders(payload.data ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AccountShell title="Orders">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No orders yet.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/preview')}>
                Start an order
              </Button>
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const expanded = expandedIds.has(order.id);
                const totalNum = typeof order.total === 'number' ? order.total : Number(order.total) || 0;
                return (
                  <div key={order.id} className="rounded-lg border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(order.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                    >
                      {order.productImage && (
                        <img src={order.productImage} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{order.productTitle ?? 'Order'}</div>
                        <div className="text-xs text-muted-foreground">{fmtDate(order.createdAt)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm">{formatAmount(totalNum, order.currency)}</div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="shrink-0 text-muted-foreground">
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
                        {(order.items ?? []).map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.title ?? 'Item'}</div>
                              <div className="text-xs text-muted-foreground">
                                {[item.size, item.color].filter(Boolean).join(' / ')}
                                {item.qty > 1 ? ` × ${item.qty}` : ''}
                              </div>
                            </div>
                            <div className="text-sm font-medium shrink-0">
                              {formatAmount(typeof item.total === 'number' ? item.total : Number(item.total) || 0, order.currency)}
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="text-sm font-semibold">
                            Total: {formatAmount(totalNum, order.currency)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            Track
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AccountShell>
  );
}
