import './globals.css';
import type { ReactNode } from 'react';
import { AppThemeProvider } from '@/app/components/theme-provider';
import { Toaster } from '@/app/components/ui/sonner';

export const metadata = {
  title: 'UK2ME Admin',
  description: 'Operational Commerce Dashboard'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppThemeProvider>
          {children}
          <Toaster />
        </AppThemeProvider>
      </body>
    </html>
  );
}

