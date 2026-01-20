'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, User, ShoppingBag, Settings } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ThemeToggle } from '@/app/components/theme-toggle';

export function ClientHeader() {
  const pathname = usePathname();
  const isOrders = pathname === '/orders' || pathname.startsWith('/orders/');

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001/admin';

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <Package className="h-6 w-6 text-foreground" />
            <span className="text-xl font-semibold text-foreground">UK2ME</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild variant={isOrders ? 'default' : 'ghost'} className="gap-2">
              <Link href="/orders">
                <ShoppingBag className="h-4 w-4" />
                My Orders
              </Link>
            </Button>
            <Button asChild variant={pathname === '/profile' ? 'default' : 'ghost'} className="gap-2">
              <Link href="/profile">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </Button>
            <ThemeToggle />
            <Button asChild variant="outline" className="gap-2">
              <Link href={adminUrl}>
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

