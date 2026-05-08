'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Upload, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';

type Order = {
  id: string;
  status: string;
  customerName: string;
  customerEmail: string | null;
  productTitle: string | null;
  updatedAt: string;
  hasPendingAttempt: boolean;
};

export default function AdminQueuePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/proxy/v1/admin/orders?status=AWAITING_PURCHASE', { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => { if (payload?.ok) setOrders(payload.data ?? []); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() =>
    orders.filter((o) => (o.productTitle ?? '').toLowerCase().includes(searchQuery.toLowerCase())),
    [orders, searchQuery]
  );

  const handleSaveNote = async (orderId: string) => {
    const note = noteValues[orderId] ?? '';
    const key = `note-${orderId}-${Date.now()}`;
    await fetch(`/api/proxy/v1/admin/orders/${orderId}/purchase-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
      credentials: 'include',
      body: JSON.stringify({ note })
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Purchase Queue</h1>
          <p className="text-muted-foreground mt-2">Orders requiring manual or automated attention</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Queue Items</CardTitle>
            <div className="text-sm text-muted-foreground">{orders.length} items pending</div>
          </div>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Action Required
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <Input
              placeholder="Search products in queue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline" className="gap-2">
              <Clock className="h-4 w-4" />
              Sort by ETA
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading queue...</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No orders in queue
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            {order.customerEmail && (
                              <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{order.productTitle ?? '—'}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.updatedAt).toLocaleString('en-GB')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/orders/${order.id}`)}
                            >
                              View
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2">
                                  <FileText className="h-4 w-4" />
                                  Add Note
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Purchase Note</DialogTitle>
                                  <DialogDescription>
                                    Document how this purchase attempt will be handled.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="note">Notes</Label>
                                    <Textarea
                                      id="note"
                                      placeholder="Provide details..."
                                      className="min-h-[120px]"
                                      value={noteValues[order.id] ?? ''}
                                      onChange={(e) => setNoteValues((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                    />
                                  </div>
                                  <Button className="w-full gap-2" onClick={() => handleSaveNote(order.id)}>
                                    <Upload className="h-4 w-4" />
                                    Save Note
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
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
