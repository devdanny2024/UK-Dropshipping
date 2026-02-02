'use client';

import { useEffect, useState } from 'react';
import { Activity, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';

type Adapter = {
  id: string;
  name: string;
  domain: string;
  status: 'online' | 'offline';
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
      const res = await fetch(`${apiBase}/adapters`, { credentials: 'include' });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload?.error?.message ?? 'Failed to load adapters');
      setAdapters(payload.data.adapters ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load adapters');
    } finally {
      setLoading(false);
    }
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
          <Power className="h-4 w-4" />
          {loading ? 'Checking…' : 'Run Health Check'}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Adapter Status</CardTitle>
          <Badge variant="secondary">
            {loading ? 'Loading…' : `${adapters.length} adapters`}
          </Badge>
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
                  <TableHead>Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adapters.map((adapter) => (
                  <TableRow key={adapter.id}>
                    <TableCell>
                      <div className="font-medium">{adapter.name}</div>
                    </TableCell>
                    <TableCell>{adapter.domain}</TableCell>
                    <TableCell>
                      <Badge variant={adapter.status === 'online' ? 'default' : 'secondary'}>
                        <span className="inline-flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          {adapter.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch defaultChecked={adapter.status === 'online'} disabled />
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && adapters.length === 0 && !error && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                      No adapters configured yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

