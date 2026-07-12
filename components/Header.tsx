'use client';

import { useState } from 'react';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import { useApp } from '@/lib/app-context';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/LoadingSkeleton';

const ROLE_COLORS: Record<string, string> = {
  'Fleet Manager':     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Dispatcher':        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Safety Officer':    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Financial Analyst': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export function Header() {
  const { user, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { theme, setTheme, mounted } = useTheme();
  const [search, setSearch] = useState('');

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] ?? 'bg-muted text-muted-foreground';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-14 bg-background border-b flex items-center px-6 gap-4 z-30 transition-all duration-200 ease-in-out',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
      role="banner"
      aria-label="Main header"
    >
      {/* Mobile-style toggle button always visible */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer lg:hidden"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Menu className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="pl-9 h-9 text-sm bg-muted/50 border-input rounded-lg"
          aria-label="Search across the platform"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative w-9 h-9 rounded-lg bg-muted/50 border border-input flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mounted && (
            <>
              <Sun className={`w-[18px] h-[18px] transition-all duration-300 ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} aria-hidden="true" />
              <Moon className={`absolute w-[18px] h-[18px] transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} aria-hidden="true" />
            </>
          )}
        </button>

        <button
          className="relative w-9 h-9 rounded-lg bg-muted/50 border border-input flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
          aria-label="Notifications: 3 unread"
        >
          <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center" aria-hidden="true">3</span>
        </button>

        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border border-transparent ${roleColor}`}>
          {user.role}
        </span>

        <div className="flex items-center gap-2.5 pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-primary-foreground text-xs font-bold tracking-wide" aria-hidden="true">
            {user.initials}
          </div>
          <span className="text-sm font-medium text-foreground">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
