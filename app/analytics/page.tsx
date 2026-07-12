'use client';

import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';
import { monthlyRevenue } from '@/lib/mock-data';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

const CHART_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function AnalyticsPage() {
  const { vehicles, fuelLogs, maintenance, trips } = useApp();

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaintCost = maintenance.reduce((s, m) => s + m.cost, 0);
  const totalOpsCost = totalFuelCost + totalMaintCost;

  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const nonRetired = vehicles.filter(v => v.status !== 'Retired').length;
  const utilization = nonRetired > 0 ? ((activeVehicles / nonRetired) * 100).toFixed(1) : '0.0';

  const totalFuelLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const completedTrips = trips.filter(t => t.status === 'Completed');
  const totalDistance = completedTrips.reduce((s, t) => s + t.plannedDistance, 0);
  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(1) : '0.0';

  const totalAcquisition = vehicles.reduce((s, v) => s + v.acquisitionCost, 0);
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const roi = totalAcquisition > 0
    ? (((totalRevenue - totalOpsCost) / totalAcquisition) * 100).toFixed(1)
    : '0.0';

  // Costliest vehicles
  const vehicleCosts = vehicles.map(v => {
    const fuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
    const maint = maintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    return { id: v.id, name: v.regNo, cost: fuel + maint };
  }).sort((a, b) => b.cost - a.cost).slice(0, 6);

  const maxCost = Math.max(...vehicleCosts.map(v => v.cost), 1);

  function exportCSV() {
    const rows = [
      ['Metric', 'Value'],
      ['Fuel Efficiency (km/l)', fuelEfficiency],
      ['Fleet Utilization (%)', utilization],
      ['Operational Cost ($)', totalOpsCost],
      ['Vehicle ROI (%)', roi],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transitops-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Analytics & Reports</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fleet performance insights</p>
          </div>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search..." className="pl-8 h-8 text-sm" />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Fuel Efficiency" value={`${fuelEfficiency} km/l`} sub="Completed trips / fuel" />
          <KpiCard label="Fleet Utilization" value={`${utilization}%`} sub="Active / non-retired" />
          <KpiCard label="Operational Cost" value={`$${totalOpsCost.toLocaleString()}`} sub="Fuel + Maintenance" />
          <KpiCard label="Vehicle ROI" value={`${roi}%`} sub="Revenue − Costs / Acquisition" />
        </div>

        <p className="text-xs text-slate-400">
          ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
        </p>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Bar Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {monthlyRevenue.map((_, i) => (
                    <Cell key={i} fill={i === monthlyRevenue.length - 1 ? '#3b82f6' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Costliest Vehicles */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Top Costliest Vehicles</h2>
            <div className="space-y-3">
              {vehicleCosts.map((v, i) => (
                <div key={v.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{v.name}</span>
                    <span className="text-slate-500">${v.cost.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(v.cost / maxCost) * 100}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
              {vehicleCosts.every(v => v.cost === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">No cost data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
