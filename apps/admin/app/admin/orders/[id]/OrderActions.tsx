'use client';

import { useState } from 'react';
import { Truck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

export function DispatchAction({ orderId, onStatusChange }: { orderId: string; onStatusChange?: (status: string) => void }) {
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = carrier.trim().length > 0 && trackingNumber.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proxy/v1/admin/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ carrier: carrier.trim(), trackingNumber: trackingNumber.trim() })
      });
      const payload = await res.json();
      if (payload?.ok) {
        onStatusChange?.('SHIPPED');
        toast.success('Order marked as dispatched');
        setCarrier('');
        setTrackingNumber('');
      } else {
        toast.error(payload?.error?.message ?? 'Could not dispatch order');
      }
    } catch {
      toast.error('Failed to dispatch order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Mark dispatched
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="carrier">Delivery company</Label>
          <Input
            id="carrier"
            placeholder="e.g. DHL"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tracking">Tracking ID</Label>
          <Input
            id="tracking"
            placeholder="e.g. JD0123456789"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="gap-2">
          <Truck className="h-4 w-4" />
          {submitting ? 'Submitting...' : 'Mark dispatched'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function WalletCreditAction({ orderId, currency }: { orderId: string; currency: string }) {
  const [amount, setAmount] = useState('');
  const [creditCurrency, setCreditCurrency] = useState(currency || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountNum = Number(amount);
  const canSubmit = Number.isFinite(amountNum) && amountNum > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { amount: amountNum };
      if (creditCurrency.trim()) body.currency = creditCurrency.trim();
      if (reason.trim()) body.reason = reason.trim();
      const res = await fetch(`/api/proxy/v1/admin/orders/${orderId}/wallet-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const payload = await res.json();
      if (payload?.ok) {
        const balances = payload.data?.balances;
        const match = Array.isArray(balances)
          ? balances.find((b: { currency?: string }) => b.currency === (creditCurrency.trim() || currency))
          : undefined;
        const balText = match ? ` — new balance ${match.currency} ${Number(match.amount ?? match.balance ?? 0).toFixed(2)}` : '';
        toast.success(`Wallet credited${balText}`);
        setAmount('');
        setReason('');
      } else {
        toast.error(payload?.error?.message ?? 'Could not issue wallet credit');
      }
    } catch {
      toast.error('Failed to issue wallet credit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Issue wallet credit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="credit-amount">Amount</Label>
            <Input
              id="credit-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit-currency">Currency</Label>
            <Input
              id="credit-currency"
              placeholder="e.g. GBP"
              value={creditCurrency}
              onChange={(e) => setCreditCurrency(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="credit-reason">Reason</Label>
          <Textarea
            id="credit-reason"
            placeholder="e.g. Item out of stock"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="gap-2">
          <Wallet className="h-4 w-4" />
          {submitting ? 'Crediting...' : 'Issue credit'}
        </Button>
      </CardContent>
    </Card>
  );
}
