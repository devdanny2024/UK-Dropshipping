'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  Truck,
  Store,
  Users,
  Settings,
  Package,
  Shield,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/purchase-queue', label: 'Purchase Queue', icon: Clock },
  { href: '/admin/shipments', label: 'Shipments', icon: Truck },
  { href: '/admin/adapters', label: 'Store Adapters', icon: Store },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/roles', label: 'Roles', icon: Shield },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL ?? 'http://localhost:3000';

  return (
    <div className="w-64 border-r border-sidebar-border bg-sidebar h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-sidebar-foreground" />
          <span className="text-xl font-semibold text-sidebar-foreground">UK2ME Ops</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start gap-3"
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <Button asChild variant="ghost" className="w-full justify-start gap-3">
          <Link href={clientUrl}>
            <Package className="h-4 w-4" />
            Switch to Client
          </Link>
        </Button>
      </div>
    </div>
  );
}

