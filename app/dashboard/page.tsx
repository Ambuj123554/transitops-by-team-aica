'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useApp } from '@/lib/app-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeInsights } from '@/lib/insights';
import { Lightbulb, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-modern p-5 flex flex-col gap-1">
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
    </div>
  );
}

const VEHICLE_STATUS_LABELS = ['Available', 'On Trip', 'In Shop', 'Retired'] as const;
const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-emerald-500',
  'On Trip': 'bg-blue-500',
  'In Shop': 'bg-amber-500',
  Retired: 'bg-muted-foreground/40',
};

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  alert: <AlertCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
  success: <Lightbulb className="w-4 h-4 text-emerald-500" />,
};

const INSIGHT_BORDERS: Record<string, string> = {
  alert: 'border-l-red-400 bg-red-50/40',
  warning: 'border-l-amber-400 bg-amber-50/40',
  info: 'border-l-blue-400 bg-blue-50/40',
  success: 'border-l-emerald-400 bg-emerald-50/40',
};

export default function DashboardPage() {
  const { vehicles, drivers, trips, maintenance, fuelLogs } = useApp();
  const [vehicleType, setVehicleType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [region, setRegion] = useState('all');
  const [advisorExpanded, setAdvisorExpanded] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  const insights = useMemo(
    () => computeInsights(vehicles, drivers, trips, maintenance, fuelLogs),
    [vehicles, drivers, trips, maintenance, fuelLogs]
  );

  const visibleInsights = insights.filter(i => !dismissedInsights.includes(i.id));

  const allDrivers = drivers;
  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const driverMap = Object.fromEntries(allDrivers.map(d => [d.id, d]));

  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const inMaintenance = vehicles.filter(v => v.status === 'In Shop').length;
  const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter(t => t.status === 'Draft' || t.status === 'Pending Approval').length;
  const driversOnDuty = allDrivers.filter(d => d.status === 'On Trip').length;
  const utilization = vehicles.length > 0
    ? Math.round((activeVehicles / vehicles.filter(v => v.status !== 'Retired').length) * 100)
    : 0;

  const recentTrips = [...trips].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const vehicleStatusCounts = VEHICLE_STATUS_LABELS.map(s => ({
    label: s,
    count: vehicles.filter(v => v.status === s).length,
    color: STATUS_COLORS[s],
  }));
  const maxCount = Math.max(...vehicleStatusCounts.map(v => v.count), 1);

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time fleet operations overview</p>
        </div>

        {/* AI Operations Advisor */}
        {visibleInsights.length > 0 && (
          <div className="card-modern overflow-hidden mb-6">
            <button
              onClick={() => setAdvisorExpanded(!advisorExpanded)}
              className="w-full px-5 py-3 border-b border-border flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold">AI</span>
                <h2 className="font-semibold text-foreground text-sm">Operations Advisor</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                  {visibleInsights.length} insight{visibleInsights.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {dismissedInsights.length > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); setDismissedInsights([]); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <svg
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform duration-200',
                    advisorExpanded && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {advisorExpanded && (
              <div className="divide-y divide-border/50">
                {visibleInsights.map((insight, idx) => (
                  <div
                    key={insight.id}
                    className={cn(
                      'flex items-start gap-3 px-5 py-3 border-l-4 transition-all duration-200 hover:brightness-105 group',
                      INSIGHT_BORDERS[insight.type]
                    )}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {INSIGHT_ICONS[insight.type] ?? <Info className="w-4 h-4 text-slate-400" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                    </div>
                    <button
                      onClick={() => setDismissedInsights(prev => [...prev, insight.id])}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-background/80 cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Active Vehicles" value={activeVehicles} sub="Currently on trip" />
          <KpiCard label="Available Vehicles" value={availableVehicles} sub="Ready to dispatch" />
          <KpiCard label="In Maintenance" value={inMaintenance} sub="In shop" />
          <KpiCard label="Active Trips" value={activeTrips} sub="Dispatched" />
          <KpiCard label="Pending Trips" value={pendingTrips} sub="Draft / Approval" />
          <KpiCard label="Drivers on Duty" value={driversOnDuty} sub="Currently on trip" />
          <KpiCard label="Fleet Utilization" value={`${utilization}%`} sub="Active / Non-retired" />
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trips */}
          <div className="lg:col-span-2 card-modern overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Trips</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map(trip => {
                    const vehicle = vehicleMap[trip.vehicleId];
                    const driver = trip.driverId ? driverMap[trip.driverId] : null;
                    return (
                      <tr key={trip.id}>
                        <td className="font-mono text-xs font-semibold text-foreground">{trip.id}</td>
                        <td>{vehicle?.regNo ?? '—'}</td>
                        <td>{driver?.name ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                        <td><StatusBadge status={trip.status} /></td>
                        <td>{trip.eta}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Status */}
          <div className="card-modern">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Vehicle Status</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              {vehicleStatusCounts.map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground/80">{label}</span>
                    <span className="text-sm font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Total fleet: {vehicles.length} vehicles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
