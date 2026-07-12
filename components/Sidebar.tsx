'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import { ROLE_PERMISSIONS, NAV_PERMISSION_MAP } from '@/lib/types';
import {
  LayoutDashboard, Truck, Users, Map, Wrench,
  Fuel, BarChart3, Settings, LogOut,
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
  const { user, logout } = useApp();

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  function canAccess(permKey: string | null): boolean {
    if (!permKey || !permissions) return true;
    return permissions[permKey] !== 'none';
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0e1016] flex flex-col z-40 border-r border-white/[0.06]">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <span className="text-white font-semibold tracking-tight text-xl">TransitOps</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const accessible = canAccess(item.permKey);
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          if (!accessible) {
            return (
              <div key={item.href} className="flex items-center gap-3 px-4 py-2.5 rounded-lg opacity-30 cursor-not-allowed select-none">
                <Icon className="w-[18px] h-[18px] text-slate-400" />
                <span className="text-sm text-slate-400">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
              )}
            >
              <Icon className={cn(
                'w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150',
                isActive ? 'text-blue-400' : 'text-slate-500'
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
