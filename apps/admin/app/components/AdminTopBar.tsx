'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ThemeToggle } from '@/app/components/theme-toggle';

export function AdminTopBar() {
  return (
    <div className="border-b border-border bg-background px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers, or products..."
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">Admin User</div>
              <div className="text-xs text-muted-foreground">admin@uk2me.com</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
              A
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

