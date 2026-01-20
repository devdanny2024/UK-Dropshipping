import './globals.css';
import type { ReactNode } from 'react';
import { AppThemeProvider } from '@/app/components/theme-provider';
import { ClientHeader } from '@/app/components/ClientHeader';
import { Toaster } from '@/app/components/ui/sonner';

export const metadata = {
  title: 'UK2ME Client',
  description: 'Client experience for UK2ME'
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

