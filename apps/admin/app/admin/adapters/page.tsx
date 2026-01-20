'use client';

import { Activity, Power, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { mockStoreAdapters } from '@/data/mockData';

export default function AdminAdaptersPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Store Adapters</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage automated store integrations</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Power className="h-4 w-4" />
          Run Health Check
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Adapter Status</CardTitle>
          <Badge variant="secondary">{mockStoreAdapters.length} adapters</Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStoreAdapters.map((adapter) => (
                  <TableRow key={adapter.id}>
                    <TableCell>
                      <div className="font-medium">{adapter.domain}</div>
                      {adapter.lastFailureReason && (
                        <div className="text-xs text-red-600 dark:text-red-300 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {adapter.lastFailureReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={adapter.status === 'active' ? 'default' : 'secondary'}>
                        {adapter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {adapter.successRate}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {adapter.successfulAttempts} / {adapter.totalAttempts}
                    </TableCell>
                    <TableCell>
                      {new Date(adapter.lastRun).toLocaleString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <Switch defaultChecked={adapter.status === 'active'} />
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

