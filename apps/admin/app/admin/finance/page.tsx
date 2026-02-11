'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

const apiBase = '/api/proxy';

export default function AdminFinancePage() {
  const [feePercent, setFeePercent] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/v1/admin/finance`, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok) setFeePercent(Number(payload.data.feePercent ?? 5));
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const preview = useMemo(() => {
    const base = 100;
    const fee = (base * feePercent) / 100;
    return { base, fee, total: base + fee };
  }, [feePercent]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/v1/admin/finance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feePercent })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload?.error?.message ?? 'Save failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-semibold">Finance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Platform Fee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <label className="text-sm text-muted-foreground">Fee percentage</label>
          <Input type="number" min={0} max={100} step="0.1" value={feePercent} onChange={(e) => setFeePercent(Number(e.target.value))} />
          <div className="rounded-md border border-border p-3 text-sm">
            Preview (GBP 100 item): fee GBP {preview.fee.toFixed(2)}, effective price GBP {preview.total.toFixed(2)}
          </div>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
