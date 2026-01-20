'use client';

import { Package, User, ShoppingBag, Settings } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface ClientHeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function ClientHeader({ onNavigate, currentPage }: ClientHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('client-home')}
          >
            <Package className="h-6 w-6 text-foreground" />
            <span className="text-xl font-semibold text-foreground">UK2ME</span>
          </div>
          
          <nav className="flex items-center gap-2">
            <Button
              variant={currentPage === 'client-orders' ? 'default' : 'ghost'}
              onClick={() => onNavigate('client-orders')}
              className="gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              My Orders
            </Button>
            <Button
              variant={currentPage === 'client-profile' ? 'default' : 'ghost'}
              onClick={() => onNavigate('client-profile')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('admin-dashboard')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

