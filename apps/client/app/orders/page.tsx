'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { StatusBadge } from '@/app/components/StatusBadge';
import { AccountShell } from '@/app/components/AccountShell';

type Order = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  productTitle: string | null;
};

export default function ClientOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/v1/orders', { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok) setOrders(payload.data ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

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
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.productTitle ?? '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{order.currency} {order.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Track
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AccountShell>
  );
}
