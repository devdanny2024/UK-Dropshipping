'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountShell } from '@/app/components/AccountShell';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderId.trim()) return;
    router.push(`/orders/${encodeURIComponent(orderId.trim())}`);
  };

  return (
    <AccountShell title="Track Order">
      <Card>
        <CardHeader>
          <CardTitle>Track your order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <Input
              placeholder="Enter order ID (e.g. ORD-2024-0147)"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            />
            <Button type="submit">Track order</Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Use the order ID from your confirmation email to view the latest status updates.
          </p>
        </CardContent>
      </Card>
    </AccountShell>
  );
}
