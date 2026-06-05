'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/app/components/ui/dialog';

type WeightPriceRequest = {
  id: string;
  orderId: string;
  orderItemId: string | null;
  productUrl: string;
  category: string | null;
  status: string;
  resolvedPrice: number | null;
  currency: string | null;
  createdAt: string;
};

export default function AdminWeightPriceRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WeightPriceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('REQUESTED');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = (filter: string) => {
    setLoading(true);
    const url = filter === 'all'
      ? '/api/proxy/v1/admin/weight-price-requests'
      : `/api/proxy/v1/admin/weight-price-requests?status=${filter}`;
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => { if (payload?.ok) setRequests(payload.data?.requests ?? []); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const handleResolve = async (id: string) => {
    const resolvedPrice = Number(prices[id]);
    const currency = (currencies[id] ?? '').trim();
    if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0 || !currency) {
      toast.error('Enter a valid price and currency');
      return;
    }
    setPendingId(id);
    try {
      const res = await fetch(`/api/proxy/v1/admin/weight-price-requests/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolvedPrice, currency })
      });
      const payload = await res.json();
      if (payload?.ok) {
        // Resolving moves it to PRICED — drop from the REQUESTED list (or unless viewing all).
        setRequests((prev) =>
          statusFilter === 'REQUESTED'
            ? prev.filter((r) => r.id !== id)
            : prev.map((r) => (r.id === id ? { ...r, ...payload.data?.request } : r))
        );
        toast.success('Weight price resolved');
      } else {
        toast.error(payload?.error?.message ?? 'Could not resolve request');
      }
    } catch {
      toast.error('Failed to resolve request');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Weight Price Requests</h1>
          <p className="text-muted-foreground mt-2">Manually price items awaiting a weight quote</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Requests</CardTitle>
          <Badge variant="secondary">{requests.length} items</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REQUESTED">Requested</SelectItem>
                <SelectItem value="PRICED">Priced</SelectItem>
                <SelectItem value="AUTO">Auto</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading requests...</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Button
                            variant="link"
                            className="h-auto p-0 font-medium"
                            onClick={() => router.push(`/admin/orders/${r.orderId}`)}
                          >
                            {r.orderId}
                          </Button>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <a
                            href={r.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 underline truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{r.productUrl}</span>
                          </a>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.category ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'REQUESTED' ? 'outline' : 'default'}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === 'REQUESTED' ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2">
                                  <Scale className="h-4 w-4" />
                                  Resolve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Resolve weight price</DialogTitle>
                                  <DialogDescription>Order {r.orderId}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label htmlFor={`price-${r.id}`}>Price</Label>
                                      <Input
                                        id={`price-${r.id}`}
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={prices[r.id] ?? ''}
                                        onChange={(e) => setPrices((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`currency-${r.id}`}>Currency</Label>
                                      <Input
                                        id={`currency-${r.id}`}
                                        placeholder="e.g. GBP"
                                        value={currencies[r.id] ?? ''}
                                        onChange={(e) => setCurrencies((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    className="w-full gap-2"
                                    disabled={pendingId === r.id}
                                    onClick={() => handleResolve(r.id)}
                                  >
                                    <Scale className="h-4 w-4" />
                                    {pendingId === r.id ? 'Resolving...' : 'Resolve'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {r.currency} {r.resolvedPrice?.toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
