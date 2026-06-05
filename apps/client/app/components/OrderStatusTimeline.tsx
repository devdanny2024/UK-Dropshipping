'use client';

import { Check, Circle, AlertTriangle, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'INVOICED', label: 'Invoiced' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const;

// Map backend statuses that aren't an exact step name onto a step index.
const STATUS_TO_STEP: Record<string, number> = {
  PLACED: 0,
  INVOICED: 1,
  INVOICE_SENT: 1,
  AWAITING_PURCHASE: 2,
  PROCESSING: 2,
  PURCHASED: 2,
  SHIPPED: 3,
  IN_TRANSIT: 3,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
};

export function OrderStatusTimeline({ status }: { status: string }) {
  const upper = (status ?? '').toUpperCase();
  const isCancelled = upper === 'CANCELLED';
  const isComplaint = upper === 'COMPLAINT' || upper === 'ISSUE' || upper === 'ACTION_REQUIRED';
  const currentIndex = STATUS_TO_STEP[upper] ?? 0;

  return (
    <div>
      <div className="flex items-start">
        {STEPS.map((step, index) => {
          const done = !isCancelled && index < currentIndex;
          const current = !isCancelled && index === currentIndex;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center w-full">
                <div className={`h-0.5 flex-1 ${index === 0 ? 'bg-transparent' : done || current ? 'bg-primary' : 'bg-border'}`} />
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? 'bg-primary border-primary text-primary-foreground'
                      : current
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Circle className={`h-3 w-3 ${current ? 'fill-primary' : ''}`} />}
                </div>
                <div className={`h-0.5 flex-1 ${index === STEPS.length - 1 ? 'bg-transparent' : done ? 'bg-primary' : 'bg-border'}`} />
              </div>
              <span className={`mt-2 text-xs ${current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {(isCancelled || isComplaint) && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-md border p-3 text-sm ${
            isCancelled
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
          }`}
        >
          {isCancelled ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span className="font-medium">{isCancelled ? 'This order was cancelled.' : 'This order has an open complaint / issue.'}</span>
        </div>
      )}
    </div>
  );
}
