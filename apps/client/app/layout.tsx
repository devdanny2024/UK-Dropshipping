import './globals.css';
import type { ReactNode } from 'react';
import { AppThemeProvider } from '@/app/components/theme-provider';
import { ClientHeader } from '@/app/components/ClientHeader';
import { Toaster } from '@/app/components/ui/sonner';

export const metadata = {
  title: 'Uk2meonline',
  description: 'Uk2meonline client experience'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppThemeProvider>
          <ClientHeader />
          {children}
          <Toaster />
        </AppThemeProvider>
      </body>
    </html>
  );
}

