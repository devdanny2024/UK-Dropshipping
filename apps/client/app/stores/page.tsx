'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { mockStoreAdapters } from '@/data/mockData';

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Store Adapters</h1>
          <p className="text-muted-foreground mt-2">Live status of supported UK store integrations.</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Online Stores</CardTitle>
            <Badge variant="secondary">{mockStoreAdapters.length} stores</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockStoreAdapters.map((adapter) => (
              <div
                key={adapter.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        adapter.status === 'active'
                          ? 'h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse'
                          : 'h-2.5 w-2.5 rounded-full bg-red-500'
                      }
                      aria-hidden="true"
                    />
                    <div className="font-medium text-foreground">{adapter.domain}</div>
                    <Badge variant={adapter.status === 'active' ? 'default' : 'destructive'}>
                      {adapter.status === 'active' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  {adapter.lastFailureReason && (
                    <div className="text-sm text-red-600 dark:text-red-300 mt-2">
                      {adapter.lastFailureReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {adapter.successRate}% success
                  </div>
                  <div>{adapter.totalAttempts} attempts</div>
                  <div>Last run {new Date(adapter.lastRun).toLocaleString('en-GB')}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
