'use client';

import { Badge } from "@/app/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PLACED: { label: 'Placed', variant: 'secondary' },
  PROCESSING: { label: 'Processing', variant: 'default' },
  AWAITING_PURCHASE: { label: 'Awaiting Purchase', variant: 'outline' },
  SHIPPED: { label: 'Shipped', variant: 'default' },
  DELIVERED: { label: 'Delivered', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  CREATED: { label: 'Created', variant: 'secondary' },
  IN_TRANSIT: { label: 'In Transit', variant: 'default' },
  ISSUE: { label: 'Issue', variant: 'destructive' },
  paid: { label: 'Paid', variant: 'default' },
  purchasing: { label: 'Purchasing', variant: 'secondary' },
  purchased: { label: 'Purchased', variant: 'default' },
  inbound_uk: { label: 'Inbound to UK', variant: 'secondary' },
  received_uk: { label: 'Received in UK', variant: 'default' },
  shipped_nigeria: { label: 'Shipped to Nigeria', variant: 'secondary' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'default' },
  action_required: { label: 'Action Required', variant: 'destructive' },
  active: { label: 'Active', variant: 'default' },
  disabled: { label: 'Disabled', variant: 'secondary' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'outline' as const };
  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
}
