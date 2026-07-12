'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import * as api from '@/lib/api';

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-modern p-5 space-y-1">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

const CHART_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function AnalyticsPage() {
  const { vehicles, fuelLogs, maintenance, trips } = useApp();

  // Backend-backed state
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [topCostlyVehicles, setTopCostlyVehicles] = useState<{ id: string; name: string; cost: number }[]>([]);
  const [analyticsKpis, setAnalyticsKpis] = useState<{
    fuelEfficiencyKmPerL?: number;
    fleetUtilizationPct?: number;
    operationalCost?: number;
    vehicleRoiPct?: number;
  }>({});
  const [exporting, setExporting] = useState(false);

  // Fetch analytics data from backend on mount
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [summary, monthlyRev, costly] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getMonthlyRevenue(),
          api.getTopCostlyVehicles(),
        ]);
        setAnalyticsKpis(summary);
        setMonthlyRevenue(monthlyRev);
        setTopCostlyVehicles(costly.map(v => ({ id: v.id, name: v.regNo, cost: v.cost })));
      } catch {
        // Backend unavailable — analytics will fallback to local computation
      }
    }
    fetchAnalytics();
  }, []);

  // Local fallback: compute monthly revenue from completed trips
  const localMonthlyRevenue = (() => {
    const monthMap: Record<string, number> = {};
    const now = new Date();
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short' });
      monthMap[key] = 0;
    }
    // Aggregate revenue from completed trips
    const completed = trips.filter(t => t.status === 'Completed');
    for (const trip of completed) {
      if (trip.createdAt) {
        const month = new Date(trip.createdAt + 'T00:00:00').toLocaleString('en-US', { month: 'short' });
        if (monthMap[month] !== undefined) {
          // Estimate revenue from distance * weight ratio (since local Trip type doesn't have revenue field)
          const estRevenue = Math.round((trip.plannedDistance / 10) * (trip.cargoWeight / 1000) * 0.8);
          monthMap[month] += estRevenue;
        }
      }
    }
    return Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue }));
  })();

  // Use backend data if available, otherwise local fallback
  const displayMonthlyRevenue = monthlyRevenue.length > 0 ? monthlyRevenue : localMonthlyRevenue;

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaintCost = maintenance.reduce((s, m) => s + m.cost, 0);
  const totalOpsCost = totalFuelCost + totalMaintCost;

  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const nonRetired = vehicles.filter(v => v.status !== 'Retired').length;
  const utilization = analyticsKpis.fleetUtilizationPct?.toFixed(1) ?? (nonRetired > 0 ? ((activeVehicles / nonRetired) * 100).toFixed(1) : '0.0');

  const totalFuelLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const completedTrips = trips.filter(t => t.status === 'Completed');
  const totalDistance = completedTrips.reduce((s, t) => s + t.plannedDistance, 0);
  const fuelEfficiency = analyticsKpis.fuelEfficiencyKmPerL?.toFixed(1) ?? (totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(1) : '0.0');

  const totalOps = analyticsKpis.operationalCost ?? totalOpsCost;
  const roi = analyticsKpis.vehicleRoiPct?.toFixed(1) ?? '0.0';

  // Vehicle costs for chart (use backend data if available, otherwise local computation)
  const vehicleCosts = topCostlyVehicles.length > 0
    ? topCostlyVehicles
    : vehicles.map(v => {
        const fuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
        const maint = maintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
        return { id: v.id, name: v.regNo, cost: fuel + maint };
      }).sort((a, b) => b.cost - a.cost).slice(0, 6);

  const maxCost = Math.max(...vehicleCosts.map(v => v.cost), 1);



  async function exportCSV() {
    setExporting(true);
    try {
      const csvText = await api.exportAnalyticsCsv();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transitops-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: generate CSV locally
      const rows = [
        ['Metric', 'Value'],
        ['Fuel Efficiency (km/l)', fuelEfficiency],
        ['Fleet Utilization (%)', utilization],
        ['Operational Cost ($)', totalOps.toLocaleString()],
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
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-title">Analytics & Reports</h1>
            <p className="page-subtitle">Fleet performance insights</p>
          </div>
          <Button variant="outline" className="gap-2 rounded-lg cursor-pointer" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search..." className="pl-9 h-9 text-sm rounded-lg" />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Fuel Efficiency" value={`${fuelEfficiency} km/l`} sub="Completed trips / fuel" />
          <KpiCard label="Fleet Utilization" value={`${utilization}%`} sub="Active / non-retired" />
          <KpiCard label="Operational Cost" value={`$${totalOps.toLocaleString()}`} sub="Fuel + Maintenance" />
          <KpiCard label="Vehicle ROI" value={`${roi}%`} sub="Revenue − Costs / Acquisition" />
        </div>

        <p className="text-xs text-slate-400">
          ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
        </p>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Bar Chart */}
          <div className="card-modern p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={displayMonthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {displayMonthlyRevenue.map((_, i) => (
                    <Cell key={i} fill={i === displayMonthlyRevenue.length - 1 ? '#3b82f6' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Costliest Vehicles */}
          <div className="card-modern p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Top Costliest Vehicles</h2>
            <div className="space-y-4">
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
