import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppThemeProvider } from '@/app/components/theme-provider';
import { ClientHeader } from '@/app/components/ClientHeader';
import { Toaster } from '@/app/components/ui/sonner';
import { Package, Instagram, Twitter, Facebook } from 'lucide-react';

export const metadata = {
  title: 'UK2ME — Shop UK, Delivered to Nigeria',
  description: 'Shop any UK store and get it delivered straight to your door in Nigeria. Transparent pricing, automated purchase, live tracking.'
};

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg brand-gradient flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span style={{ color: 'var(--brand-violet)' }}>UK</span>
                <span style={{ color: 'var(--brand-amber)' }}>2ME</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The easiest way to shop UK stores and receive deliveries in Nigeria. Trusted by 1,200+ shoppers.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Facebook].map((Icon, i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Shop</h4>
            <ul className="space-y-2 text-sm">
              {[['Browse Products', '/shop'], ['Partner Stores', '/stores'], ['Track Order', '/orders'], ['Paste a Link', '/preview']].map(([label, href]) => (
                <li key={href}><Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Account</h4>
            <ul className="space-y-2 text-sm">
              {[['Sign Up', '/signup'], ['Log In', '/login'], ['My Orders', '/orders'], ['Profile', '/profile']].map(([label, href]) => (
                <li key={href}><Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@uk2meonline.com" className="text-muted-foreground hover:text-foreground transition-colors">support@uk2meonline.com</a></li>
              <li><span className="text-muted-foreground">Mon–Fri 9am–6pm WAT</span></li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                  🇬🇧 UK → 🇳🇬 Nigeria
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} UK2ME Online. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Terms of Service</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppThemeProvider>
          <ClientHeader />
          <main>{children}</main>
          <SiteFooter />
          <Toaster />
        </AppThemeProvider>
      </body>
    </html>
  );
}

