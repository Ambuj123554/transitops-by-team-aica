'use client';

import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { Input } from '@/components/ui/input';

const ROLE_COLORS: Record<string, string> = {
  'Fleet Manager':     'bg-blue-50 text-blue-700',
  'Dispatcher':        'bg-emerald-50 text-emerald-700',
  'Safety Officer':    'bg-amber-50 text-amber-700',
  'Financial Analyst': 'bg-purple-50 text-purple-700',
};

export function Header() {
  const { user } = useApp();
  const [search, setSearch] = useState('');

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700';

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center px-6 gap-4 z-30">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="pl-9 h-9 text-sm bg-slate-50/80 border-slate-200 rounded-lg"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button className="relative w-9 h-9 rounded-lg bg-slate-50/80 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150 cursor-pointer">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">3</span>
        </button>

        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${roleColor}`}>
          {user.role}
        </span>

        <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold tracking-wide">
            {user.initials}
          </div>
          <span className="text-sm font-medium text-slate-700">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
