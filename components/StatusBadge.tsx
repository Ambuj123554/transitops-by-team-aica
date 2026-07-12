'use client';

import { cn } from '@/lib/utils';
import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '@/lib/types';

type Status = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus | string;

const STATUS_STYLES: Record<string, string> = {
  Available:   'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  'On Trip':   'bg-blue-50 text-blue-700 border-blue-200/60',
  'In Shop':   'bg-amber-50 text-amber-700 border-amber-200/60',
  Retired:     'bg-muted text-muted-foreground border-border/60',
  'Off Duty':  'bg-muted text-muted-foreground border-border/60',
  Suspended:   'bg-red-50 text-red-700 border-red-200/60',
  Draft:       'bg-muted text-muted-foreground border-border/60',
  Dispatched:  'bg-blue-50 text-blue-700 border-blue-200/60',
  Completed:   'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  Cancelled:   'bg-red-50 text-red-700 border-red-200/60',
  Active:      'bg-amber-50 text-amber-700 border-amber-200/60',
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border/60';
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border',
      style, className
    )}>
      {status}
    </span>
  );
}
