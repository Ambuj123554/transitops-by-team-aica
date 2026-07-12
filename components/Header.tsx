'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { Input } from '@/components/ui/input';

const ROLE_COLORS: Record<string, string> = {
  'Fleet Manager':     'bg-blue-100 text-blue-800',
  'Dispatcher':        'bg-green-100 text-green-800',
  'Safety Officer':    'bg-amber-100 text-amber-800',
  'Financial Analyst': 'bg-purple-100 text-purple-800',
};

export function Header() {
  const { user } = useApp();
  const [search, setSearch] = useState('');

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700';

  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 z-30">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="pl-8 h-8 text-sm bg-slate-50 border-slate-200"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColor}`}>
          {user.role}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
            {user.initials}
          </div>
          <span className="text-sm font-medium text-slate-700">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
