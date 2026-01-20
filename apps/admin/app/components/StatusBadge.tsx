'use client';

import { Badge } from "@/app/components/ui/badge";
import type { OrderStatus } from "@/data/mockData";

interface StatusBadgeProps {
  status: OrderStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: 'Paid', variant: 'default' },
      purchasing: { label: 'Purchasing', variant: 'secondary' },
      purchased: { label: 'Purchased', variant: 'default' },
      inbound_uk: { label: 'Inbound to UK', variant: 'secondary' },
      received_uk: { label: 'Received in UK', variant: 'default' },
      shipped_nigeria: { label: 'Shipped to Nigeria', variant: 'secondary' },
      out_for_delivery: { label: 'Out for Delivery', variant: 'default' },
      delivered: { label: 'Delivered', variant: 'default' },
      action_required: { label: 'Action Required', variant: 'destructive' },
      pending: { label: 'Pending', variant: 'outline' },
      failed: { label: 'Failed', variant: 'destructive' },
      active: { label: 'Active', variant: 'default' },
      disabled: { label: 'Disabled', variant: 'secondary' },
    };

    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
}


