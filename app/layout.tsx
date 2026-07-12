import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/lib/app-context';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TransitOps — Smart Transport Operations Platform',
  description: 'Fleet management, dispatch, compliance, and analytics in one unified platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AppProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
