'use client';

import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  Truck,
  Store,
  Users,
  Settings,
  Package,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface AdminSidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function AdminSidebar({ onNavigate, currentPage }: AdminSidebarProps) {
  const menuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-orders', label: 'Orders', icon: ShoppingCart },
    { id: 'admin-queue', label: 'Purchase Queue', icon: Clock },
    { id: 'admin-shipments', label: 'Shipments', icon: Truck },
    { id: 'admin-adapters', label: 'Store Adapters', icon: Store },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 border-r border-slate-200 bg-slate-50 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-slate-900" />
          <span className="text-xl font-semibold text-slate-900">Admin Portal</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => onNavigate('client-home')}
        >
          <Package className="h-4 w-4" />
          Switch to Client
        </Button>
      </div>
    </div>
  );
}


