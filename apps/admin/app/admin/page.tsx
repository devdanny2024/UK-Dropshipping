'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, AlertTriangle, Package, Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Order = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  hasPendingAttempt: boolean;
};

const COLORS = ['#0f172a', '#475569', '#94a3b8', '#cbd5e1', '#ef4444'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/proxy/v1/admin/orders', { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => { if (payload?.ok) setOrders(payload.data ?? []); })
      .catch(() => undefined);
  }, []);

  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
  const actionRequired = orders.filter((o) => o.status === 'AWAITING_PURCHASE').length;
  const inboundUK = orders.filter((o) => o.status === 'PROCESSING').length;
  const shipped = orders.filter((o) => o.status === 'SHIPPED').length;

  const statusData = [
    { name: 'Placed', value: orders.filter((o) => o.status === 'PLACED').length },
    { name: 'Processing', value: orders.filter((o) => o.status === 'PROCESSING').length },
    { name: 'Awaiting Purchase', value: orders.filter((o) => o.status === 'AWAITING_PURCHASE').length },
    { name: 'Shipped', value: orders.filter((o) => o.status === 'SHIPPED').length },
    { name: 'Delivered', value: orders.filter((o) => o.status === 'DELIVERED').length },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Operations overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/orders')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{ordersToday}</div>
            <p className="text-xs text-muted-foreground mt-2">Based on live data</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-red-200 bg-red-50 dark:bg-red-950/30"
          onClick={() => router.push('/admin/purchase-queue')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Action Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{actionRequired}</div>
            <p className="text-xs text-red-700 dark:text-red-200 mt-2">Needs immediate attention</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{inboundUK}</div>
            <p className="text-xs text-muted-foreground mt-2">Orders being processed</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shipped</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{shipped}</div>
            <p className="text-xs text-muted-foreground mt-2">In transit to customer</p>
          </CardContent>
        </Card>
      </div>

      {statusData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded p-2 -mx-2"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div>
                      <div className="font-mono text-sm">{order.id}</div>
                      <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{order.currency} {order.total.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{order.status}</div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
