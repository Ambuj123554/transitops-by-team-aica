'use client';

import { cn } from '@/lib/utils';
import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '@/lib/types';

type Status = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus | string;

const STATUS_STYLES: Record<string, string> = {
  // Vehicle / Driver shared
  Available: 'bg-green-100 text-green-800 border-green-200',
  'On Trip': 'bg-blue-100 text-blue-800 border-blue-200',
  'In Shop': 'bg-amber-100 text-amber-800 border-amber-200',
  Retired: 'bg-slate-100 text-slate-600 border-slate-200',
  // Driver-only
  'Off Duty': 'bg-slate-100 text-slate-600 border-slate-200',
  Suspended: 'bg-red-100 text-red-800 border-red-200',
  // Trip
  Draft: 'bg-slate-100 text-slate-600 border-slate-200',
  Dispatched: 'bg-blue-100 text-blue-800 border-blue-200',
  Completed: 'bg-green-100 text-green-800 border-green-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
  // Maintenance
  Active: 'bg-amber-100 text-amber-800 border-amber-200',
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      style, className
    )}>
      {status}
    </span>
  );
}
