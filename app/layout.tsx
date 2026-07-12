import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/lib/app-context';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TransitOps — Smart Transport Operations Platform',
  description: 'Fleet management, dispatch, compliance, and analytics in one unified platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </AppProvider>
      </body>
    </html>
  );
}
