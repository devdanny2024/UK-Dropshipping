'use client';

import { useEffect, useState } from 'react';
import { Package, Plane, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { StatusBadge } from '@/app/components/StatusBadge';

type Shipment = {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
};

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/v1/admin/shipments', { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => { if (payload?.ok) setShipments(payload.data ?? []); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const inbound = shipments.filter((s) => s.status === 'CREATED' || s.status === 'IN_TRANSIT');
  const delivered = shipments.filter((s) => s.status === 'DELIVERED');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Shipments</h1>
          <p className="text-muted-foreground mt-2">Track inbound and outbound logistics</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Manifest
        </Button>
      </div>

      <Tabs defaultValue="inbound" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inbound">Active ({inbound.length})</TabsTrigger>
          <TabsTrigger value="outbound">Delivered ({delivered.length})</TabsTrigger>
        </TabsList>

        {[{ key: 'inbound', label: 'Active Shipments', icon: Package, items: inbound },
          { key: 'outbound', label: 'Delivered Shipments', icon: Plane, items: delivered }
        ].map(({ key, label, icon: Icon, items }) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading shipments...</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shipment ID</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Carrier</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No shipments
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((shipment) => (
                            <TableRow key={shipment.id}>
                              <TableCell className="font-mono text-sm">{shipment.id}</TableCell>
                              <TableCell className="font-mono text-sm">{shipment.orderId}</TableCell>
                              <TableCell>{shipment.carrier}</TableCell>
                              <TableCell className="font-mono text-sm">{shipment.trackingNumber}</TableCell>
                              <TableCell>
                                <StatusBadge status={shipment.status} />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(shipment.createdAt).toLocaleDateString('en-GB')}
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
