'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useApp } from '@/lib/app-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-14 min-h-screen">
        <div className="p-7">{children}</div>
      </main>
    </div>
  );
}
