'use client';

import { useEffect, useState } from 'react';
import { MessageSquareWarning, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { StatusBadge } from '@/app/components/StatusBadge';

type Complaint = {
  id: string;
  reason: string;
  detail?: string;
  status?: string;
  createdAt?: string;
};

export function OrderComplaints({ orderId }: { orderId: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/proxy/v1/orders/${orderId}/complaints`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const list = payload?.data ?? payload?.complaints ?? [];
        if (Array.isArray(list)) setComplaints(list);
      })
      .catch(() => undefined);
  };

  useEffect(load, [orderId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/orders/${orderId}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reason.trim(), detail: detail.trim() || undefined }),
      });
      const payload = await res.json();
      if (!res.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message ?? 'Failed to submit complaint');
      }
      setReason('');
      setDetail('');
      setOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5" /> Complaints
          </CardTitle>
          {!open && (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Raise a complaint
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <form onSubmit={submit} className="space-y-3 rounded-lg border border-border p-4">
            <div className="space-y-1.5">
              <Label htmlFor="complaint-reason">Reason *</Label>
              <Input
                id="complaint-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Wrong item received"
                required
                minLength={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complaint-detail">Details <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <textarea
                id="complaint-detail"
                className="w-full min-h-[80px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tell us what went wrong…"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="gap-2" style={{ background: 'var(--brand-violet)' }}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit complaint'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {complaints.length === 0 ? (
          !open && <p className="text-sm text-muted-foreground">No complaints raised for this order.</p>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm">{c.reason}</div>
                  {c.status && <StatusBadge status={c.status} />}
                </div>
                {c.detail && <p className="text-sm text-muted-foreground mt-1">{c.detail}</p>}
                {c.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(c.createdAt).toLocaleString('en-GB')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
