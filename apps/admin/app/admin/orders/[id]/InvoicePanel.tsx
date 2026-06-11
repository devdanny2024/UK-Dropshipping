'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Send, Save, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { StatusBadge } from '@/app/components/StatusBadge';

type InvoiceLineItem = {
  id?: string;
  storeName: string;
  productTitle: string;
  productUrl: string;
  size: string | null;
  color: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  weightGrams: number | null;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  region: string;
  currency: string;
  status: string;
  itemsSubtotal: number;
  storePostage: number;
  salesTax: number;
  internationalTransferFee: number;
  serviceCharge: number;
  nigeriaPostage: number;
  domesticPostage: number;
  total: number;
  lineItems: InvoiceLineItem[];
};

type FeeKey =
  | 'storePostage'
  | 'salesTax'
  | 'internationalTransferFee'
  | 'serviceCharge'
  | 'nigeriaPostage'
  | 'domesticPostage';

const FEE_FIELDS: Array<{ key: FeeKey; label: string }> = [
  { key: 'storePostage', label: 'Store postage' },
  { key: 'salesTax', label: 'Sales tax (US)' },
  { key: 'internationalTransferFee', label: 'Transfer fee' },
  { key: 'serviceCharge', label: 'Service charge' },
  { key: 'nigeriaPostage', label: 'Nigeria postage' },
  { key: 'domesticPostage', label: 'Domestic postage' }
];

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function InvoicePanel({ orderId, onStatusChange }: { orderId: string; onStatusChange?: (status: string) => void }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Editable working copy.
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [fees, setFees] = useState<Record<FeeKey, number>>({
    storePostage: 0,
    salesTax: 0,
    internationalTransferFee: 0,
    serviceCharge: 0,
    nigeriaPostage: 0,
    domesticPostage: 0
  });

  const hydrate = (inv: Invoice) => {
    setInvoice(inv);
    setLineItems((inv.lineItems ?? []).map((li) => ({ ...li })));
    setFees({
      storePostage: num(inv.storePostage),
      salesTax: num(inv.salesTax),
      internationalTransferFee: num(inv.internationalTransferFee),
      serviceCharge: num(inv.serviceCharge),
      nigeriaPostage: num(inv.nigeriaPostage),
      domesticPostage: num(inv.domesticPostage)
    });
  };

  useEffect(() => {
    fetch(`/api/proxy/v1/admin/orders/${orderId}/invoice`, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok && payload.data?.invoice) hydrate(payload.data.invoice);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [orderId]);

  const itemsSubtotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + num(li.unitPrice) * num(li.qty), 0),
    [lineItems]
  );

  const liveTotal = useMemo(
    () => itemsSubtotal + FEE_FIELDS.reduce((sum, f) => sum + num(fees[f.key]), 0),
    [itemsSubtotal, fees]
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, Array<{ item: InvoiceLineItem; index: number }>>();
    lineItems.forEach((item, index) => {
      const key = item.storeName || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ item, index });
    });
    return Array.from(groups.entries());
  }, [lineItems]);

  // Warn the admin about zero/missing fee lines before sending a draft.
  const warnings = useMemo(() => {
    const list: string[] = [];
    if (num(fees.nigeriaPostage) === 0) list.push('Nigeria postage is 0.');
    if (num(fees.storePostage) === 0) list.push('Store postage is 0 — no store→warehouse fee.');
    if (num(fees.internationalTransferFee) === 0) list.push('International transfer fee is 0.');
    if (invoice?.region === 'US' && num(fees.serviceCharge) === 0) list.push('Service charge is 0.');
    return list;
  }, [fees, invoice?.region]);

  const handleBuild = async () => {
    setBuilding(true);
    try {
      const res = await fetch(`/api/proxy/v1/admin/orders/${orderId}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const payload = await res.json();
      if (payload?.ok && payload.data?.invoice) {
        hydrate(payload.data.invoice);
        onStatusChange?.('PENDING_INVOICE');
        toast.success('Draft invoice created');
      } else {
        toast.error(payload?.error?.message ?? 'Could not build invoice');
      }
    } catch {
      toast.error('Failed to build invoice');
    } finally {
      setBuilding(false);
    }
  };

  const updateLinePrice = (index: number, value: string) => {
    setLineItems((prev) =>
      prev.map((li, i) => (i === index ? { ...li, unitPrice: num(value), lineTotal: num(value) * num(li.qty) } : li))
    );
  };

  const updateFee = (key: FeeKey, value: string) => {
    setFees((prev) => ({ ...prev, [key]: num(value) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/v1/admin/orders/${orderId}/invoice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lineItems: lineItems.map((li) => ({
            storeName: li.storeName,
            productTitle: li.productTitle,
            productUrl: li.productUrl,
            size: li.size,
            color: li.color,
            qty: li.qty,
            unitPrice: li.unitPrice,
            lineTotal: num(li.unitPrice) * num(li.qty),
            weightGrams: li.weightGrams
          })),
          ...fees
        })
      });
      const payload = await res.json();
      if (payload?.ok && payload.data?.invoice) {
        hydrate(payload.data.invoice);
        toast.success('Invoice updated');
      } else {
        toast.error(payload?.error?.message ?? 'Could not save invoice');
      }
    } catch {
      toast.error('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (warnings.length > 0) {
      const proceed = window.confirm(
        `This invoice has zeroed fee lines:\n\n${warnings.join('\n')}\n\nSend it to the customer anyway?`,
      );
      if (!proceed) return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/proxy/v1/admin/orders/${orderId}/invoice/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const payload = await res.json();
      if (payload?.ok && payload.data?.invoice) {
        hydrate(payload.data.invoice);
        onStatusChange?.('INVOICED');
        toast.success(payload.data.emailed ? 'Invoice sent to customer' : 'Invoice sent (email not delivered)');
      } else {
        toast.error(payload?.error?.message ?? 'Could not send invoice');
      }
    } catch {
      toast.error('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const currency = invoice?.currency ?? '';
  const isSent = invoice?.status === 'SENT';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">Loading invoice...</CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">No invoice has been built for this order yet.</p>
          <Button onClick={handleBuild} disabled={building} className="gap-2">
            <FileText className="h-4 w-4" />
            {building ? 'Building...' : 'Build draft invoice'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice {invoice.invoiceNumber}
        </CardTitle>
        <StatusBadge status={invoice.status} />
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedItems.map(([storeName, entries]) => (
          <div key={storeName} className="space-y-3">
            <div className="text-sm font-semibold capitalize">{storeName}</div>
            <div className="space-y-3">
              {entries.map(({ item, index }) => (
                <div key={item.id ?? index} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.productTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {[item.size, item.color].filter(Boolean).join(' / ') || '—'} × {item.qty}
                      </div>
                    </div>
                    {item.productUrl && (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`unit-${index}`} className="text-xs text-muted-foreground">
                        Unit price ({currency})
                      </Label>
                      <Input
                        id={`unit-${index}`}
                        type="number"
                        step="0.01"
                        className="w-32"
                        value={item.unitPrice}
                        disabled={isSent}
                        onChange={(e) => updateLinePrice(index, e.target.value)}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Line total</div>
                      <div className="font-medium">
                        {currency} {(num(item.unitPrice) * num(item.qty)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Items subtotal</span>
            <span className="font-medium">{currency} {itemsSubtotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEE_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`fee-${f.key}`} className="text-xs text-muted-foreground">
                  {f.label} ({currency})
                </Label>
                <Input
                  id={`fee-${f.key}`}
                  type="number"
                  step="0.01"
                  value={fees[f.key]}
                  disabled={isSent}
                  onChange={(e) => updateFee(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold">{currency} {liveTotal.toFixed(2)}</span>
        </div>

        {!isSent && warnings.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Check fee lines before sending
            </div>
            <ul className="mt-2 list-disc pl-6 space-y-0.5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {!isSent && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button onClick={handleSend} disabled={sending || saving} className="gap-2">
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send invoice'}
            </Button>
          </div>
        )}
        {isSent && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            This invoice has been sent and can no longer be edited.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
