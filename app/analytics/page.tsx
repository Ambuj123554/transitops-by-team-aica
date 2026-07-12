'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import * as api from '@/lib/api';
import { toast } from 'sonner';

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
const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const COST_COLORS = { fuel: '#f59e0b', maintenance: '#3b82f6', expenses: '#8b5cf6' };

// ── Local monthly revenue computation (works with any date range) ──────────

function computeLocalRevenue(trips: { status: string; createdAt: string; plannedDistance: number; cargoWeight: number }[]) {
  const monthMap: Record<string, number> = {};
  const completed = trips.filter(t => t.status === 'Completed');

  for (const trip of completed) {
    if (trip.createdAt) {
      const d = new Date(trip.createdAt + 'T00:00:00');
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      // Estimate revenue from distance * weight
      const estRevenue = Math.round((trip.plannedDistance / 10) * (trip.cargoWeight / 1000) * 0.8);
      monthMap[key] = (monthMap[key] || 0) + estRevenue;
    }
  }

  // Sort by date using actual year from key ("Aug 2023" -> Aug 1, 2023)
  const sorted = Object.entries(monthMap)
    .map(([monthYear, revenue]) => {
      const parts = monthYear.split(' ');
      const sortKey = new Date(`${parts[0]} 1, ${parts[1]}`).getTime();
      return { monthYear, revenue, sortKey };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

  return sorted.map(({ monthYear, revenue }) => ({
    month: monthYear.split(' ')[0], // Just "Aug", "Sep" etc
    revenue,
  }));
}

// ── Chart helpers ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function PctTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-lg px-3 py-2 text-xs">
      <p style={{ color: payload[0].color }} className="font-semibold">{payload[0].name}</p>
      <p className="text-slate-600">{payload[0].value} trip{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

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
  const [pdfExporting, setPdfExporting] = useState(false);

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
        // Backend unavailable — fallback to local computation
      }
    }
    fetchAnalytics();
  }, []);

  // ── Computed metrics ─────────────────────────────────────────────────────

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

  // ── Revenue chart ────────────────────────────────────────────────────────
  const localMonthlyRev = useMemo(() => computeLocalRevenue(trips), [trips]);
  // Use backend data only if it has at least one non-zero revenue entry
  const backendHasData = monthlyRevenue.some(m => m.revenue > 0);
  const displayMonthlyRevenue = backendHasData ? monthlyRevenue : localMonthlyRev;

  // ── Vehicle costs ────────────────────────────────────────────────────────
  const vehicleCosts = topCostlyVehicles.length > 0
    ? topCostlyVehicles
    : vehicles.map(v => {
        const fuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
        const maint = maintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
        return { id: v.id, name: v.regNo, cost: fuel + maint };
      }).sort((a, b) => b.cost - a.cost).slice(0, 6);

  const maxCost = Math.max(...vehicleCosts.map(v => v.cost), 1);

  // ── Trip status distribution ─────────────────────────────────────────────
  const tripStatusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trips) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [trips]);

  // ── Cost breakdown: Fuel vs Maintenance per vehicle type ─────────────────
  const costBreakdown = useMemo(() => {
    const types = Array.from(new Set(vehicles.map(v => v.type)));
    return types.map(type => {
      const ids = vehicles.filter(v => v.type === type).map(v => v.id);
      const fuel = fuelLogs.filter(f => ids.includes(f.vehicleId)).reduce((s, f) => s + f.cost, 0);
      const maint = maintenance.filter(m => ids.includes(m.vehicleId)).reduce((s, m) => s + m.cost, 0);
      return { name: type.replace(' Truck', '').replace(' Van', ''), fuel: Math.round(fuel), maintenance: Math.round(maint) };
    });
  }, [vehicles, fuelLogs, maintenance]);

  // ── Vehicle type distribution ────────────────────────────────────────────
  const vehicleTypeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vehicles) {
      const short = v.type.replace(' Truck', 'T').replace(' Van', 'V');
      counts[short] = (counts[short] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  // ── Maintenance cost trend ───────────────────────────────────────────────
  const maintTrend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const m of maintenance) {
      if (m.date) {
        const month = new Date(m.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' });
        byMonth[month] = (byMonth[month] || 0) + m.cost;
      }
    }
    const order = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    return order.filter(m => byMonth[m]).map(m => ({ month: m, cost: Math.round(byMonth[m]) }));
  }, [maintenance]);

  async function exportPDF() {
    setPdfExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      await import('jspdf-autotable');
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('TransitOps — Analytics Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Fuel Efficiency: ${fuelEfficiency} km/l`, 14, 40);
      doc.text(`Fleet Utilization: ${utilization}%`, 14, 47);
      doc.text(`Operational Cost: $${totalOps.toLocaleString()}`, 14, 54);
      doc.text(`Vehicle ROI: ${roi}%`, 14, 61);

      // Table of top costly vehicles
      if (vehicleCosts.length > 0) {
        (doc as any).autoTable({
          startY: 70,
          head: [['Vehicle', 'Type', 'Total Cost']],
          body: vehicleCosts.slice(0, 10).map(v => [v.name, '—', `$${v.cost.toLocaleString()}`]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }

      // Revenue chart description if data exists
      if (displayMonthlyRevenue.length > 0) {
        const lastY = (doc as any).lastAutoTable?.finalY ?? 70;
        doc.setFontSize(12);
        doc.text('Monthly Revenue', 14, lastY + 15);
        doc.setFontSize(10);
        displayMonthlyRevenue.slice(0, 6).forEach((r, i) => {
          doc.text(`${r.month}: $${r.revenue.toLocaleString()}`, 14, lastY + 25 + i * 7);
        });
      }

      doc.save('transitops-analytics-report.pdf');
      toast.success('PDF report downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF. Using fallback.');
      // Fallback to CSV if PDF fails
      await exportCSV();
    } finally {
      setPdfExporting(false);
    }
  }

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
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-lg cursor-pointer" onClick={exportPDF} disabled={pdfExporting}>
              <FileText className="w-4 h-4" /> {pdfExporting ? 'Generating...' : 'Export PDF'}
            </Button>
            <Button variant="outline" className="gap-2 rounded-lg cursor-pointer" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
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

        {/* ── Row 1: Revenue + Trip Status ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue */}
          <div className="lg:col-span-2 card-modern p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
            {displayMonthlyRevenue.length > 0 ? (
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
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {displayMonthlyRevenue.map((_, i) => (
                      <Cell key={i} fill={i === displayMonthlyRevenue.length - 1 ? '#3b82f6' : '#bfdbfe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No revenue data available yet
              </div>
            )}
          </div>

          {/* Trip Status Distribution */}
          <div className="card-modern p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Trip Status</h2>
            {tripStatusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={tripStatusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {tripStatusDist.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PctTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, marginTop: -8 }}
                    formatter={(value: string) => <span className="text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No trip data
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Cost Breakdown + Vehicle Types ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Breakdown by Vehicle Type */}
          <div className="lg:col-span-2 card-modern p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Cost Breakdown by Vehicle Type</h2>
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={costBreakdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fuel" name="Fuel" stackId="a" fill={COST_COLORS.fuel} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill={COST_COLORS.maintenance} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No cost data available
              </div>
            )}
          </div>

          {/* Vehicle Type Distribution */}
          <div className="card-modern p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Fleet Composition</h2>
            {vehicleTypeDist.length > 0 ? (
              <div className="space-y-4 pt-2">
                {vehicleTypeDist.map((item, i) => {
                  const total = vehicleTypeDist.reduce((s, x) => s + x.value, 0);
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="text-slate-500">{item.value} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Total: {vehicles.length} vehicles</p>
                </div>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No vehicle data
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: Maintenance Trend + Top Costly Vehicles ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Maintenance Cost Trend */}
          <div className="lg:col-span-2 card-modern p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Maintenance Cost Trend</h2>
            {maintTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={maintTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cost" name="Maintenance Cost" radius={[4, 4, 0, 0]} fill="#f59e0b">
                    {maintTrend.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No maintenance data
              </div>
            )}
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
