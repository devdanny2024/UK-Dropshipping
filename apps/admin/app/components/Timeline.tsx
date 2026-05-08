'use client';

import { Check, Clock } from 'lucide-react';

type TimelineEvent = {
  id?: string;
  type?: string;
  message?: string;
  createdAt?: string;
  status?: string;
  description?: string;
  timestamp?: string;
  trackingNumber?: string;
};

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="space-y-6">
      {events.map((event, index) => {
        const label = event.type ?? event.status ?? '';
        const detail = event.message ?? event.description ?? '';
        const ts = event.createdAt ?? event.timestamp ?? '';
        return (
          <div key={event.id ?? index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </div>
              {index < events.length - 1 && (
                <div className="w-px flex-1 bg-border mt-2" />
              )}
            </div>
            <div className="flex-1 pb-8">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-medium text-foreground">{label}</h4>
                {ts && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ts).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{detail}</p>
              {event.trackingNumber && (
                <div className="mt-2 inline-block bg-secondary px-3 py-1 rounded text-xs font-mono text-foreground">
                  {event.trackingNumber}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
