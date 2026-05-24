'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { AccountShell } from '@/app/components/AccountShell';
import { StatusBadge } from '@/app/components/StatusBadge';

type Order = {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  productTitle: string | null;
};

const TRENDING_STORES = [
  { name: 'ASOS', domain: 'asos.com', status: 'online' },
  { name: 'Zara', domain: 'zara.com', status: 'online' },
  { name: 'Amazon UK', domain: 'amazon.co.uk', status: 'online' },
  { name: 'H&M', domain: 'hm.com', status: 'online' },
  { name: 'Next', domain: 'next.co.uk', status: 'online' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [productUrl, setProductUrl] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/proxy/v1/orders', { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => { if (payload?.ok) setOrders(payload.data ?? []); })
      .catch(() => undefined);
  }, []);

  const delivered = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'delivered');
  const ongoing = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'delivered', 'action_required'].includes(o.status));
  const others = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'action_required');

  const metrics = [
    { key: 'total', label: 'All Orders', value: orders.length, items: orders },
    { key: 'delivered', label: 'Delivered', value: delivered.length, items: delivered },
    { key: 'ongoing', label: 'Ongoing', value: ongoing.length, items: ongoing },
    { key: 'others', label: 'Others', value: others.length, items: others },
  ];

  const handleStartOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productUrl.trim()) return;
    router.push(`/preview?url=${encodeURIComponent(productUrl.trim())}`);
  };

  return (
    <AccountShell title="My Account">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-semibold">{metric.value}</div>
                <Accordion type="single" collapsible>
                  <AccordionItem value={`${metric.key}-orders`} className="border-none">
                    <AccordionTrigger className="py-2 text-xs text-muted-foreground">
                      View details
                    </AccordionTrigger>
                    <AccordionContent>
                      {metric.value === 0 ? (
                        <div className="text-xs text-muted-foreground">No orders yet.</div>
                      ) : (
                        <div className="space-y-3">
                          {metric.items.slice(0, 3).map((order) => (
                            <div key={order.id} className="rounded-md border border-border p-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium">{order.productTitle ?? 'Order'}</div>
                                  <div className="text-xs text-muted-foreground">{order.id}</div>
                                </div>
                                <StatusBadge status={order.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Make your order now</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleStartOrder}>
                <Input
                  placeholder="Paste a UK store product link"
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                />
                <Button type="submit">Create preview</Button>
              </form>
              <p className="text-sm text-muted-foreground">
                We&apos;ll fetch the product details, show a quote, and guide you through checkout.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trending stores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {TRENDING_STORES.map((store) => (
                <div key={store.domain} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{store.name}</div>
                    <div className="text-xs text-muted-foreground">{store.domain}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="gap-2 border-green-200 text-green-700 dark:border-green-700 dark:text-green-200"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Online
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AccountShell>
  );
}
