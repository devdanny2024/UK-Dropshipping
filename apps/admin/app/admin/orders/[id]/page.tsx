'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, User, Package, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Separator } from '@/app/components/ui/separator';
import { StatusBadge } from '@/app/components/StatusBadge';
import { Timeline } from '@/app/components/Timeline';
import { Badge } from '@/app/components/ui/badge';
import { mockOrders, mockShipments } from '@/data/mockData';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

  const order = useMemo(() => {
    const found = mockOrders.find((item) => item.id === rawId);
    return found ?? mockOrders[0];
  }, [rawId]);

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
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Badge variant={order.purchaseMode === 'AUTO' ? 'default' : 'secondary'}>
            {order.purchaseMode}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="product">Product Snapshot</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="attempts">Purchase Attempts</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
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
                  <div className="font-medium text-foreground">{order.customerName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-sm text-foreground">{order.customerEmail}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Customer ID</div>
                  <div className="text-sm font-mono text-foreground">{order.customerId}</div>
                </div>
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
                <div>
                  <div className="text-sm text-muted-foreground">Store</div>
                  <div className="font-medium text-foreground">{order.storeDomain}</div>
                </div>
                {order.size && (
                  <div>
                    <div className="text-sm text-muted-foreground">Size</div>
                    <div className="text-sm text-foreground">{order.size}</div>
                  </div>
                )}
                {order.color && (
                  <div>
                    <div className="text-sm text-muted-foreground">Color</div>
                    <div className="text-sm text-foreground">{order.color}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Quantity</div>
                  <div className="text-sm text-foreground">{order.quantity}</div>
                </div>
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
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <StatusBadge status={order.paymentStatus} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-2xl font-bold text-foreground">
                    {order.currency} {order.total.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Date</div>
                  <div className="text-sm text-foreground">
                    {new Date(order.createdAt).toLocaleString('en-GB')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quote Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Price</span>
                  <span className="font-medium">
                    {order.currency} {order.itemPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-medium">
                    {order.currency} {order.serviceFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UK Delivery</span>
                  <span className="font-medium">
                    {order.ukDelivery === 0 ? 'Free' : `${order.currency} ${order.ukDelivery.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">International Shipping</span>
                  <span className="font-medium">
                    {order.currency} {order.internationalShipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duties Buffer</span>
                  <span className="font-medium">
                    {order.currency} {order.dutiesBuffer.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FX Conversion</span>
                  <span className="font-medium">
                    {order.currency} {order.fxConversion.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Fee</span>
                  <span className="font-medium">
                    {order.currency} {order.paymentFee.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">
                    {order.currency} {order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 flex-col lg:flex-row">
                <img
                  src={order.productImage}
                  alt={order.productName}
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Product Name</div>
                    <div className="font-medium text-foreground text-lg">{order.productName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Product URL</div>
                    <a
                      href={order.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                    >
                      {order.productUrl}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {order.size && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Size</div>
                        <div className="text-sm text-foreground">{order.size}</div>
                      </div>
                    )}
                    {order.color && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Color</div>
                        <div className="text-sm text-foreground">{order.color}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={order.timeline} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.purchaseMode === 'AUTO' ? (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge>AUTO</Badge>
                      <StatusBadge
                        status={
                          order.status === 'purchased' ||
                          order.status === 'inbound_uk' ||
                          order.status === 'received_uk' ||
                          order.status === 'shipped_nigeria' ||
                          order.status === 'out_for_delivery' ||
                          order.status === 'delivered'
                            ? 'purchased'
                            : 'purchasing'
                        }
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Automated purchase attempt via {order.storeDomain} adapter</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Started:{' '}
                        {new Date(
                          order.timeline.find((item) => item.status === 'Purchasing')?.timestamp ||
                            order.createdAt
                        ).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">MANUAL</Badge>
                      {order.assignedStaff && (
                        <span className="text-sm text-muted-foreground">
                          Assigned to: {order.assignedStaff}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Manual purchase required</p>
                      {order.actionReason && (
                        <p className="mt-2 text-amber-900 dark:text-amber-200 font-medium">
                          Reason: {order.actionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockShipments.filter((shipment) => shipment.orderId === order.id).length === 0 ? (
                <div className="text-sm text-muted-foreground">No shipment updates yet.</div>
              ) : (
                mockShipments
                  .filter((shipment) => shipment.orderId === order.id)
                  .map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <div className="font-medium">{shipment.carrier}</div>
                        <div className="text-sm text-muted-foreground">{shipment.trackingNumber}</div>
                      </div>
                      <Badge variant="secondary">{shipment.status}</Badge>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
