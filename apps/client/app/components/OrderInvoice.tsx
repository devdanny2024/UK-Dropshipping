'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { StatusBadge } from '@/app/components/StatusBadge';

type LineItem = {
  id?: string;
  storeName?: string;
  productTitle?: string;
  productUrl?: string;
  qty?: number;
  unitPrice?: number;
  lineTotal?: number;
};

type InvoiceTotals = {
  itemsSubtotal?: number;
  storePostage?: number;
  salesTax?: number;
  internationalTransferFee?: number;
  serviceCharge?: number;
  nigeriaPostage?: number;
  domesticPostage?: number;
  total?: number;
};

type Invoice = InvoiceTotals & {
  status?: string;
  currency?: string;
  lineItems?: LineItem[];
};

const TOTAL_ROWS: Array<{ key: keyof InvoiceTotals; label: string }> = [
  { key: 'itemsSubtotal', label: 'Items subtotal' },
  { key: 'storePostage', label: 'Store postage' },
  { key: 'salesTax', label: 'Sales tax' },
  { key: 'internationalTransferFee', label: 'Transfer fee' },
  { key: 'serviceCharge', label: 'Service charge' },
  { key: 'nigeriaPostage', label: 'Nigeria postage' },
  { key: 'domesticPostage', label: 'Domestic delivery' },
];

export function OrderInvoice({ orderId, currency }: { orderId: string; currency?: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proxy/v1/orders/${orderId}/invoice`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const inv = payload?.data?.invoice ?? payload?.invoice ?? null;
        if (inv) setInvoice(inv);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading || !invoice) return null;

  const ccy = invoice.currency ?? currency ?? '';
  const fmt = (value: number | undefined | null) =>
    value == null ? null : `${ccy} ${value.toFixed(2)}`;

  const lineItems = invoice.lineItems ?? [];
  const grouped = lineItems.reduce<Record<string, LineItem[]>>((acc, li) => {
    const store = li.storeName ?? 'Items';
    (acc[store] ??= []).push(li);
    return acc;
  }, {});

  const isPaid = (invoice.status ?? '').toUpperCase() === 'PAID';

  const payInvoice = () => {
    if (typeof invoice.total === 'number') {
      localStorage.setItem('uk2me-active-quote', JSON.stringify({ total: invoice.total, currency: ccy }));
    }
    router.push(`/pay?orderId=${orderId}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Invoice
          </CardTitle>
          {invoice.status && <StatusBadge status={invoice.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {Object.entries(grouped).map(([store, lines]) => (
          <div key={store}>
            <div className="text-sm font-semibold mb-2">{store}</div>
            <div className="space-y-1.5">
              {lines.map((li, i) => (
                <div key={li.id ?? i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {li.productTitle ?? 'Item'}
                    {li.qty ? ` × ${li.qty}` : ''}
                  </span>
                  <span>{fmt(li.lineTotal) ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {lineItems.length > 0 && <Separator />}

        <div className="space-y-1.5">
          {TOTAL_ROWS.map(({ key, label }) => {
            const value = fmt(invoice[key]);
            if (value == null) return null;
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span>{value}</span>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span style={{ color: 'var(--brand-violet)' }}>{fmt(invoice.total) ?? '—'}</span>
        </div>

        {isPaid ? (
          <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-700 dark:text-green-400 text-center font-medium">
            This invoice has been paid.
          </div>
        ) : (
          <Button
            className="w-full gap-2"
            style={{ background: 'var(--brand-violet)' }}
            disabled={typeof invoice.total !== 'number'}
            onClick={payInvoice}
          >
            <CreditCard className="h-4 w-4" />
            Pay {fmt(invoice.total) ?? 'invoice'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
