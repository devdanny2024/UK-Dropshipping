'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { StatusBadge } from '@/app/components/StatusBadge';
import { Timeline } from '@/app/components/Timeline';
import { mockOrders } from '@/data/mockData';

export default function ClientTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

  const order = useMemo(() => {
    const found = mockOrders.find((item) => item.id === rawId);
    return found ?? mockOrders[0];
  }, [rawId]);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.push('/orders')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>

        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{order.productName}</CardTitle>
                <div className="text-sm text-muted-foreground">{order.id}</div>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Store</div>
                <div className="font-medium">{order.storeDomain}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Paid</div>
                <div className="font-medium">
                  {order.currency} {order.total.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">{new Date(order.updatedAt).toLocaleString('en-GB')}</div>
              </div>
            </div>

            {order.requiresAction && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:bg-red-950/30 dark:text-red-100">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-medium">Action Required</div>
                  <div className="text-sm">{order.actionReason}</div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <Timeline events={order.timeline} />
            </div>

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
    </div>
  );
}
