'use client';

import { cn } from '@/lib/utils';

/**
 * A single skeleton block for loading placeholders.
 */
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/70',
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Loading skeleton for the Dashboard page.
 * Displays placeholder shapes for KPI cards, tables, and charts.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="h-4 w-56" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl border bg-card space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <SkeletonBlock className="h-5 w-28" />
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading complete</span>
    </div>
  );
}

/**
 * Loading skeleton for data tables (Fleet, Drivers, etc.)
 */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card" role="status" aria-label="Loading table data">
      <div className="px-5 py-4 border-b">
        <SkeletonBlock className="h-5 w-32" />
      </div>
      <div className="overflow-x-auto p-5 space-y-3">
        {/* Header */}
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock key={`h-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} className="flex gap-4 py-2">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBlock key={`c-${c}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading complete</span>
    </div>
  );
}

/**
 * Loading skeleton for form modals
 */
export function FormSkeleton() {
  return (
    <div className="space-y-4 p-4" role="status" aria-label="Loading form">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <SkeletonBlock className="h-10 flex-1 rounded-lg" />
        <SkeletonBlock className="h-10 flex-1 rounded-lg" />
      </div>
      <span className="sr-only">Loading complete</span>
    </div>
  );
}

/**
 * Loading spinner for inline loading states
 */
export function LoadingSpinner({ size = 'md', label = 'Loading...' }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center gap-2" role="status" aria-label={label}>
      <svg
        className={cn('animate-spin text-primary', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Empty state component for when no data is available
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" role="status">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground/60" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}
