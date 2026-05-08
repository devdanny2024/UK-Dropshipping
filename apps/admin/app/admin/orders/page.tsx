'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { StatusBadge } from '@/app/components/StatusBadge';

type Order = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string | null;
  productTitle: string | null;
  hasPendingAttempt: boolean;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const url = statusFilter === 'all'
      ? '/api/proxy/v1/admin/orders'
      : `/api/proxy/v1/admin/orders?status=${statusFilter}`;
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => { if (payload?.ok) setOrders(payload.data ?? []); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return orders.filter((order) =>
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      (order.productTitle ?? '').toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-2">Monitor every order from payment to delivery</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Orders</CardTitle>
          <Badge variant="secondary">{filteredOrders.length} orders</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, order, or product"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setLoading(true); }}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PLACED">Placed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="AWAITING_PURCHASE">Awaiting Purchase</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading orders...</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            {order.customerEmail && (
                              <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">{order.productTitle ?? '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.currency} {order.total.toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
