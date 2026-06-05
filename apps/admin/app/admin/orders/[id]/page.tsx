'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, User, Package, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Separator } from '@/app/components/ui/separator';
import { StatusBadge } from '@/app/components/StatusBadge';
import { Timeline } from '@/app/components/Timeline';
import { Badge } from '@/app/components/ui/badge';
import { InvoicePanel } from './InvoicePanel';
import { DispatchAction, WalletCreditAction } from './OrderActions';

type OrderDetail = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string; phone: string | null } | null;
  address: {
    line1: string; line2?: string | null; city: string;
    postalCode: string; country: string; phone?: string | null;
  } | null;
  items: Array<{
    id: string; qty: number; size: string; color: string;
    unitPrice: number; total: number;
    productSnapshot: {
      id: string; title: string; url: string; imageUrl: string | null;
      price: number; currency: string;
    } | null;
  }>;
  events: Array<{ id: string; type: string; message: string; createdAt: string }>;
  shipments: Array<{ id: string; carrier: string; trackingNumber: string; status: string; createdAt: string }>;
  payments: Array<{ id: string; paymentRef: string; provider: string; amount: number; currency: string; status: string; paidAt: string | null }>;
  attempts: Array<{ id: string; status: string; note: string | null; createdAt: string }>;
};

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawId) return;
    fetch(`/api/proxy/v1/admin/orders/${rawId}`, { credentials: 'include' })
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
      <div className="p-8">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-destructive">{error ?? 'Order not found'}</p>
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const firstItem = order.items[0];
  const productSnapshot = firstItem?.productSnapshot;

  const updateStatus = (status: string) =>
    setOrder((prev) => (prev ? { ...prev, status } : prev));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/admin/orders')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{order.id}</h1>
          <p className="text-muted-foreground mt-2">Order details and management</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="product">Product Snapshot</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="attempts">Purchase Attempts</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{order.user?.name ?? 'Guest'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-sm">{order.user?.email ?? '—'}</div>
                </div>
                {order.user?.phone && (
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="text-sm">{order.user.phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {productSnapshot && (
                  <div>
                    <div className="text-sm text-muted-foreground">Title</div>
                    <div className="font-medium">{productSnapshot.title}</div>
                  </div>
                )}
                {firstItem && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Variant</div>
                      <div className="text-sm">{firstItem.size} / {firstItem.color} × {firstItem.qty}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Unit price</div>
                      <div className="text-sm">{order.currency} {firstItem.unitPrice.toFixed(2)}</div>
                    </div>
                  </>
                )}
                {productSnapshot?.url && (
                  <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                    <a href={productSnapshot.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      View product
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.payments[0] && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <StatusBadge status={order.payments[0].status} />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Provider</div>
                      <div className="text-sm font-mono">{order.payments[0].provider}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Ref</div>
                      <div className="text-xs font-mono truncate">{order.payments[0].paymentRef}</div>
                    </div>
                  </>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">{order.currency} {order.total.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}
                  {`, ${order.address.city}, ${order.address.postalCode}, ${order.address.country}`}
                </p>
                {order.address.phone && (
                  <p className="text-sm text-muted-foreground mt-1">{order.address.phone}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="product">
          {productSnapshot ? (
            <Card>
              <CardHeader>
                <CardTitle>Product Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productSnapshot.imageUrl && (
                  <img src={productSnapshot.imageUrl} alt={productSnapshot.title} className="max-h-64 object-contain rounded-lg" />
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title</span>
                    <span className="font-medium">{productSnapshot.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price at snapshot</span>
                    <span>{productSnapshot.currency} {productSnapshot.price.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Source URL</span>
                    <a href={productSnapshot.url} target="_blank" rel="noopener noreferrer"
                      className="block mt-1 text-xs font-mono text-blue-600 underline truncate">
                      {productSnapshot.url}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">No product snapshot</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {order.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events recorded.</p>
              ) : (
                <Timeline events={order.events} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {order.attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchase attempts yet.</p>
              ) : (
                <div className="space-y-3">
                  {order.attempts.map((attempt) => (
                    <div key={attempt.id} className="rounded-md border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{attempt.id}</span>
                        <Badge variant={attempt.status === 'SUCCESS' ? 'default' : attempt.status === 'FAILED' ? 'destructive' : 'secondary'}>
                          {attempt.status}
                        </Badge>
                      </div>
                      {attempt.note && <p className="text-sm text-muted-foreground">{attempt.note}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(attempt.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle>Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              {order.shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shipments created yet.</p>
              ) : (
                <div className="space-y-3">
                  {order.shipments.map((shipment) => (
                    <div key={shipment.id} className="rounded-md border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{shipment.carrier}</div>
                          <div className="font-mono text-sm text-muted-foreground">{shipment.trackingNumber}</div>
                        </div>
                        <StatusBadge status={shipment.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(shipment.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <InvoicePanel orderId={order.id} onStatusChange={updateStatus} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DispatchAction orderId={order.id} onStatusChange={updateStatus} />
            <WalletCreditAction orderId={order.id} currency={order.currency} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
