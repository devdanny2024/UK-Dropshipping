import type { ReactNode } from 'react';
import { AdminSidebar } from '@/app/components/AdminSidebar';
import { AdminTopBar } from '@/app/components/AdminTopBar';

export default function AdminLayout({ children }: { children: ReactNode }) {
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

