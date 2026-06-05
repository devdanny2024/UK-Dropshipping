'use client';

import { Truck, CalendarClock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';

type Leg = { leg?: number; speed?: string; label?: string };

export type DeliveryNoteData = {
  despatchDate?: string | null;
  estDeliveryMin?: string | null;
  estDeliveryMax?: string | null;
  deliveryNote?: { legs?: Leg[]; notices?: string[] } | null;
};

const fmtDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

/**
 * M2 R8 — Delivery Note. Renders the delivery estimate snapshotted on the order
 * (despatch day + delivery window + per-leg breakdown) so the customer sees it
 * before they pay. Returns null when no estimate has been quoted on the order.
 */
export function DeliveryNote({ data }: { data: DeliveryNoteData }) {
  const despatch = fmtDate(data.despatchDate);
  const windowMin = fmtDate(data.estDeliveryMin);
  const windowMax = fmtDate(data.estDeliveryMax);
  if (!despatch && !windowMin) return null;

  const legs = data.deliveryNote?.legs ?? [];
  const notices = data.deliveryNote?.notices ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" /> Estimated delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {despatch && (
            <div>
              <div className="text-sm text-muted-foreground">Despatches from hub</div>
              <div className="font-medium flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                {despatch}
              </div>
            </div>
          )}
          {(windowMin || windowMax) && (
            <div>
              <div className="text-sm text-muted-foreground">Arrives in Lagos</div>
              <div className="font-medium">
                {windowMin ?? '—'}{windowMax && windowMax !== windowMin ? ` – ${windowMax}` : ''}
              </div>
            </div>
          )}
        </div>

        {legs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              {legs.map((leg, i) => (
                <div key={leg.leg ?? i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{leg.label ?? `Leg ${leg.leg ?? i + 1}`}</span>
                  <span className="capitalize">{(leg.speed ?? '').toLowerCase() === 'express' ? 'Express' : 'Standard'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {notices.map((notice, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        ))}

        <p className="text-xs text-muted-foreground">
          Estimated dates based on standard processing and weekly hub despatch. Working days only; public holidays may add time.
        </p>
      </CardContent>
    </Card>
  );
}
