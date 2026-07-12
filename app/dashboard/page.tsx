'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useApp } from '@/lib/app-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-modern p-5 flex flex-col gap-1 transition-all duration-200 hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.06)]">
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

const VEHICLE_STATUS_LABELS = ['Available', 'On Trip', 'In Shop', 'Retired'] as const;
const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-emerald-500',
  'On Trip': 'bg-blue-500',
  'In Shop': 'bg-amber-500',
  Retired: 'bg-slate-400',
};

export default function DashboardPage() {
  const { vehicles, drivers, trips } = useApp();
  const [vehicleType, setVehicleType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [region, setRegion] = useState('all');

  // Use drivers from the returned object since useApp() is already called
  const allDrivers = drivers;
  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const driverMap = Object.fromEntries(allDrivers.map(d => [d.id, d]));

  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const inMaintenance = vehicles.filter(v => v.status === 'In Shop').length;
  const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter(t => t.status === 'Draft').length;
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

        {/* Filter row */}
        <div className="flex gap-3 flex-wrap">
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger className="w-44 h-9 text-sm rounded-lg">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vehicle Type: All</SelectItem>
              <SelectItem value="heavy">Heavy Truck</SelectItem>
              <SelectItem value="medium">Medium Truck</SelectItem>
              <SelectItem value="light">Light Van</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 text-sm rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on-trip">On Trip</SelectItem>
              <SelectItem value="in-shop">In Shop</SelectItem>
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-40 h-9 text-sm rounded-lg">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Region: All</SelectItem>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          <KpiCard label="Active Vehicles" value={activeVehicles} sub="Currently on trip" />
          <KpiCard label="Available Vehicles" value={availableVehicles} sub="Ready to dispatch" />
          <KpiCard label="In Maintenance" value={inMaintenance} sub="In shop" />
          <KpiCard label="Active Trips" value={activeTrips} sub="Dispatched" />
          <KpiCard label="Pending Trips" value={pendingTrips} sub="Draft stage" />
          <KpiCard label="Drivers on Duty" value={driversOnDuty} sub="Currently on trip" />
          <KpiCard label="Fleet Utilization" value={`${utilization}%`} sub="Active / Non-retired" />
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trips */}
          <div className="lg:col-span-2 card-modern overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Recent Trips</h2>
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
                        <td className="font-mono text-xs font-semibold text-slate-700">{trip.id}</td>
                        <td>{vehicle?.regNo ?? '—'}</td>
                        <td>{driver?.name ?? <span className="text-slate-400">Unassigned</span>}</td>
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
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Vehicle Status</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              {vehicleStatusCounts.map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">Total fleet: {vehicles.length} vehicles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
