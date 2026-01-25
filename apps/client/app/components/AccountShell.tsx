'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ClipboardList, FileText, LayoutDashboard, PackageSearch, Store } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/track-order', label: 'Track Order', icon: PackageSearch },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/stores', label: 'Stores', icon: Store },
];

export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">Manage your account and orders.</p>
            </Card>
            <Card className="p-2">
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={active ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2"
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
