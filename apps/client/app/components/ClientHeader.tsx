'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Store, User, ShoppingBag } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ThemeToggle } from '@/app/components/theme-toggle';

export function ClientHeader() {
  const pathname = usePathname();
  const isOrders = pathname === '/orders' || pathname.startsWith('/orders/');
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(document.cookie.includes('client_session=active'));
  }, []);

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <Package className="h-6 w-6 text-foreground" />
            <span className="text-xl font-semibold text-foreground">Uk2meonline</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild variant={pathname === '/stores' ? 'default' : 'ghost'} className="gap-2">
              <Link href="/stores">
                <Store className="h-4 w-4" />
                Stores
              </Link>
            </Button>
            {isAuthed && (
              <Button asChild variant={isOrders ? 'default' : 'ghost'} className="gap-2">
                <Link href="/orders">
                  <ShoppingBag className="h-4 w-4" />
                  My Orders
                </Link>
              </Button>
            )}
            {isAuthed && (
              <Button asChild variant={pathname === '/profile' ? 'default' : 'ghost'} className="gap-2">
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </Button>
            )}
            <Button asChild variant={pathname === '/login' ? 'default' : 'ghost'} className="gap-2">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant={pathname === '/signup' ? 'default' : 'ghost'} className="gap-2">
              <Link href="/signup">Sign up</Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}

