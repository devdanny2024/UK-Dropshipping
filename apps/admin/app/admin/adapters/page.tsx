'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';

type Adapter = {
  id: string;
  name: string;
  domain: string;
  enabled: boolean;
  status: 'UNKNOWN' | 'ONLINE' | 'OFFLINE';
  lastCheckAt?: string | null;
  notes?: string | null;
};

const apiBase = '/api/proxy';

export default function AdminAdaptersPage() {
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/admin/adapters`, { credentials: 'include' });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload?.error?.message ?? 'Failed to load adapters');
      setAdapters(payload.data.adapters ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load adapters');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdapter = async (adapter: Adapter, enabled: boolean) => {
    const res = await fetch(`${apiBase}/admin/adapters/${adapter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enabled })
    });
    const payload = await res.json();
    if (!res.ok || !payload.ok) {
      setError(payload?.error?.message ?? 'Failed to update adapter');
      return;
    }
    setAdapters((prev) => prev.map((a) => (a.id === adapter.id ? payload.data.adapter : a)));
  };

  const checkAdapter = async (adapter: Adapter) => {
    const res = await fetch(`${apiBase}/admin/adapters/${adapter.id}/check`, {
      method: 'POST',
      credentials: 'include'
    });
    const payload = await res.json();
    if (!res.ok || !payload.ok) {
      setError(payload?.error?.message ?? 'Health check failed');
      return;
    }
    setAdapters((prev) => prev.map((a) => (a.id === adapter.id ? payload.data.adapter : a)));
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Store Adapters</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage automated store integrations</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Adapter Status</CardTitle>
          <Badge variant="secondary">{loading ? 'Loading…' : `${adapters.length} adapters`}</Badge>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adapters.map((adapter) => (
                  <TableRow key={adapter.id}>
                    <TableCell className="font-medium">{adapter.name}</TableCell>
                    <TableCell>{adapter.domain}</TableCell>
                    <TableCell>
                      <Badge variant={adapter.status === 'ONLINE' ? 'default' : 'secondary'}>
                        <span className="inline-flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          {adapter.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={adapter.enabled} onCheckedChange={(value) => void toggleAdapter(adapter, value)} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {adapter.lastCheckAt ? new Date(adapter.lastCheckAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => void checkAdapter(adapter)}>Check</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
