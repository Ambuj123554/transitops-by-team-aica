'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import { ROLE_PERMISSIONS } from '@/lib/types';
import {
  LayoutDashboard, Truck, Users, Map, Wrench,
  Fuel, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',      href: '/dashboard',    icon: LayoutDashboard, permKey: null },
  { label: 'Fleet',          href: '/fleet',        icon: Truck,           permKey: 'fleet' },
  { label: 'Drivers',        href: '/drivers',      icon: Users,           permKey: 'drivers' },
  { label: 'Trips',          href: '/trips',        icon: Map,             permKey: 'trips' },
  { label: 'Maintenance',    href: '/maintenance',  icon: Wrench,          permKey: 'fleet' },
  { label: 'Fuel & Expenses',href: '/fuel',         icon: Fuel,            permKey: 'fuel' },
  { label: 'Analytics',      href: '/analytics',    icon: BarChart3,       permKey: 'analytics' },
  { label: 'Settings',       href: '/settings',     icon: Settings,        permKey: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, sidebarCollapsed, setSidebarCollapsed } = useApp();

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  function canAccess(permKey: string | null): boolean {
    if (!permKey || !permissions) return true;
    return permissions[permKey] !== 'none';
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-40 border-r border-sidebar-border transition-all duration-200 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand + Toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <span className="text-sidebar-foreground font-semibold tracking-tight text-xl">TransitOps</span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150 cursor-pointer flex-shrink-0"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const accessible = canAccess(item.permKey);
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          if (!accessible) {
            return (
              <div
        key={item.href}
        className={cn(
          'flex items-center rounded-md opacity-30 cursor-not-allowed select-none',
          sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-4 py-2.5'
        )}
      >
        <Icon className="w-5 h-5 text-sidebar-foreground/50 flex-shrink-0" />
        {!sidebarCollapsed && <span className="text-base text-sidebar-foreground/50">{item.label}</span>}
      </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-md text-base font-medium transition-all duration-150 cursor-pointer',
                sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-4 py-2.5',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={cn(
                'w-5 h-5 flex-shrink-0',
                isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
              )} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className={cn(
            'flex items-center w-full rounded-md text-base font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150 cursor-pointer',
            sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-4 py-2.5'
          )}
          title={sidebarCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
