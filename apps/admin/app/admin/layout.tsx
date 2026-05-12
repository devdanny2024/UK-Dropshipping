'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/app/components/AdminSidebar';
import { AdminTopBar } from '@/app/components/AdminTopBar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') { setChecked(true); return; }
    fetch('/api/proxy/v1/admin/auth/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => {
        if (!p?.ok) router.replace('/admin/login');
        else setChecked(true);
      })
      .catch(() => router.replace('/admin/login'));
  }, [pathname, router]);

  if (!checked && pathname !== '/admin/login') {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading…</p></div>;
  }

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminTopBar />
          {children}
        </div>
      </div>
    </div>
  );
}
