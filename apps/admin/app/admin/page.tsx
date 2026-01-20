'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, AlertTriangle, Package, Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockOrders, mockStoreAdapters } from '@/data/mockData';

export default function AdminDashboardPage() {
  const router = useRouter();
  const ordersToday = mockOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const ordersRequiringAction = mockOrders.filter((order) => order.requiresAction).length;
  const inboundUK = mockOrders.filter(
    (order) => order.status === 'inbound_uk' || order.status === 'received_uk'
  ).length;
  const outboundShipments = mockOrders.filter(
    (order) => order.status === 'shipped_nigeria' || order.status === 'out_for_delivery'
  ).length;

  const statusData = [
    { name: 'Paid', value: mockOrders.filter((order) => order.status === 'paid').length },
    { name: 'Purchasing', value: mockOrders.filter((order) => order.status === 'purchasing').length },
    {
      name: 'In Transit',
      value: mockOrders.filter((order) => ['inbound_uk', 'shipped_nigeria'].includes(order.status)).length
    },
    { name: 'Delivered', value: mockOrders.filter((order) => order.status === 'delivered').length },
    { name: 'Action Required', value: ordersRequiringAction }
  ];

  const automationData = [
    { name: 'Automated', value: mockOrders.filter((order) => order.purchaseMode === 'AUTO').length },
    { name: 'Manual', value: mockOrders.filter((order) => order.purchaseMode === 'MANUAL').length }
  ];

  const COLORS = ['#0f172a', '#475569', '#94a3b8', '#cbd5e1', '#ef4444'];
  const AUTO_COLORS = ['#22c55e', '#f59e0b'];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Operations overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/admin/orders')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{ordersToday}</div>
            <p className="text-xs text-muted-foreground mt-2">+12% from yesterday</p>
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
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{ordersRequiringAction}</div>
            <p className="text-xs text-red-700 dark:text-red-200 mt-2">Needs immediate attention</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inbound UK</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{inboundUK}</div>
            <p className="text-xs text-muted-foreground mt-2">Parcels at UK warehouse</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outbound Shipments</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{outboundShipments}</div>
            <p className="text-xs text-muted-foreground mt-2">En route to Nigeria</p>
          </CardContent>
        </Card>
      </div>

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
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
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
            <CardTitle>Automation Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={automationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {automationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AUTO_COLORS[index % AUTO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Store Adapter Performance</CardTitle>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/admin/adapters')}
            >
              View all
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockStoreAdapters.slice(0, 3).map((adapter) => (
              <div key={adapter.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{adapter.domain}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        adapter.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-100'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-100'
                      }`}
                    >
                      {adapter.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {adapter.successfulAttempts} / {adapter.totalAttempts} successful
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-semibold ${
                      adapter.successRate >= 90
                        ? 'text-green-600'
                        : adapter.successRate >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {adapter.successRate}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

