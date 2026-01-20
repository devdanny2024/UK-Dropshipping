'use client';

import { Package, Plane, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { mockShipments, mockOrders } from '@/data/mockData';

export default function AdminShipmentsPage() {
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
          <TabsTrigger value="inbound">Inbound UK</TabsTrigger>
          <TabsTrigger value="outbound">Outbound Nigeria</TabsTrigger>
        </TabsList>

        <TabsContent value="inbound">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                UK Warehouse Arrivals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockShipments
                      .filter((shipment) => shipment.type === 'inbound')
                      .map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell className="font-medium">{shipment.id}</TableCell>
                          <TableCell>{shipment.orderId}</TableCell>
                          <TableCell>{shipment.carrier}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{shipment.status}</Badge>
                          </TableCell>
                          <TableCell>{shipment.weight ?? 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outbound">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                International Shipments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ETA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockShipments
                      .filter((shipment) => shipment.type === 'outbound')
                      .map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell className="font-medium">{shipment.id}</TableCell>
                          <TableCell>{shipment.orderId}</TableCell>
                          <TableCell>{shipment.carrier}</TableCell>
                          <TableCell>
                            <Badge variant={shipment.status === 'Delivered' ? 'default' : 'secondary'}>
                              {shipment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{shipment.eta ?? 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {mockOrders.slice(0, 2).map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{order.productName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">{order.customerName}</div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Plane className="h-4 w-4" />
                        {order.status.replace(/_/g, ' ')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

