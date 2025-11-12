'use client';

import './globals.css';
import { Outfit } from 'next/font/google';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { CartProvider } from '@/contexts/CartContext';
import { LoyaltyProvider } from '@/contexts/LoyaltyContext';
import { Toaster } from '@/components/ui/toaster';

// Primary font for headings and branding
const outfitBold = Outfit({ 
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-outfit-bold',
  display: 'swap'
});

// Secondary font for body text and UI elements
const outfitRegular = Outfit({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit-regular',
  display: 'swap'
});

// Accent font for special elements
const outfitAccent = Outfit({ 
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-outfit-accent',
  display: 'swap'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isAccountPage = pathname?.startsWith('/account');
  const showHeader = !(isAdminPage || isAccountPage);

  return (
    <html lang="en">
      <body className={`${outfitBold.variable} ${outfitRegular.variable} ${outfitAccent.variable} font-sans antialiased`}>
        <LoyaltyProvider>
          <CartProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
              {showHeader && <Header />}
              <main className={showHeader ? 'pt-24' : ''}>
                {children}
              </main>
            </div>
            <Toaster />
          </CartProvider>
        </LoyaltyProvider>
      </body>
    </html>
  );
}
