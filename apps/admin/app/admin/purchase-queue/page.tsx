'use client';

import { useMemo, useState } from 'react';
import { Clock, Upload, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { mockOrders } from '@/data/mockData';

export default function AdminQueuePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const queueOrders = useMemo(
    () => mockOrders.filter((order) => order.requiresAction),
    []
  );

  const filteredOrders = useMemo(() => {
    return queueOrders.filter((order) =>
      order.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [queueOrders, searchQuery]);

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
            <div className="text-sm text-muted-foreground">{queueOrders.length} items pending</div>
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
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Button variant="outline" className="gap-2">
              <Clock className="h-4 w-4" />
              Sort by ETA
            </Button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.productName}</div>
                        <div className="text-sm text-red-600 dark:text-red-300">
                          {order.actionReason ?? 'Needs review'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.purchaseMode === 'AUTO' ? 'default' : 'secondary'}>
                        {order.purchaseMode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.updatedAt).toLocaleString('en-GB')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
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
                              <Label htmlFor="status">Action Taken</Label>
                              <Input id="status" placeholder="Manual purchase scheduled" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="note">Notes</Label>
                              <Textarea id="note" placeholder="Provide details..." className="min-h-[120px]" />
                            </div>
                            <Button className="w-full gap-2">
                              <Upload className="h-4 w-4" />
                              Save Note
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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

