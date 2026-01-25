'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Package, Store, User, ShoppingBag } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ThemeToggle } from '@/app/components/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet';

export function ClientHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isOrders = pathname === '/orders' || pathname.startsWith('/orders/');
  const [isAuthed, setIsAuthed] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

  useEffect(() => {
    fetch(`${apiBase}/v1/auth/session`, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => setIsAuthed(Boolean(payload?.ok)))
      .catch(() => setIsAuthed(false));
  }, [apiBase]);

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      setIsAuthed(false);
      router.push('/login');
    }
  };

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <Package className="h-4 w-4" />,
      active: pathname === '/dashboard',
      show: isAuthed,
    },
    {
      href: '/stores',
      label: 'Stores',
      icon: <Store className="h-4 w-4" />,
      active: pathname === '/stores',
      show: true,
    },
    {
      href: '/orders',
      label: 'My Orders',
      icon: <ShoppingBag className="h-4 w-4" />,
      active: isOrders,
      show: isAuthed,
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
      active: pathname === '/profile',
      show: isAuthed,
    },
    {
      href: '/login',
      label: 'Log in',
      icon: null,
      active: pathname === '/login',
      show: !isAuthed,
    },
    {
      href: '/signup',
      label: 'Sign up',
      icon: null,
      active: pathname === '/signup',
      show: !isAuthed,
    },
  ];

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <Package className="h-6 w-6 text-foreground" />
            <span className="text-lg font-semibold text-foreground sm:text-xl">
              Uk2meonline
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems
              .filter((item) => item.show)
              .map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={item.active ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </Button>
              ))}
            {isAuthed && (
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            )}
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5" />
                    Uk2meonline
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 px-4 pb-6">
                  {navItems
                    .filter((item) => item.show)
                    .map((item) => (
                      <Button
                        key={item.href}
                        asChild
                        variant={item.active ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2"
                      >
                        <Link href={item.href}>
                          {item.icon}
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  {isAuthed && (
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                      Log out
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

