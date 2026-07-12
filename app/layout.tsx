import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/lib/app-context';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TransitOps — Smart Transport Operations Platform',
  description: 'Fleet management, dispatch, compliance, and analytics in one unified platform.',
  keywords: ['fleet management', 'transport operations', 'dispatch', 'logistics', 'vehicle tracking'],
  authors: [{ name: 'TransitOps Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'TransitOps — Smart Transport Operations Platform',
    description: 'Fleet management, dispatch, compliance, and analytics in one unified platform.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <AppProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
