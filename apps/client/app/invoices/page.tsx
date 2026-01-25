'use client';

import { AccountShell } from '@/app/components/AccountShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

export default function InvoicesPage() {
  return (
    <AccountShell title="Invoices">
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your invoices will appear here once an order is paid and confirmed.
        </CardContent>
      </Card>
    </AccountShell>
  );
}
