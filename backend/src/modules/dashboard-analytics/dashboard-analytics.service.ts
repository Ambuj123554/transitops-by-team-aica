import { prisma } from '../../db/prisma/client';
import type { KpiQueryInput } from './dashboard-analytics.schema';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute total cost (fuel + maintenance + expenses) per vehicle.
 * Defined locally to keep modules independent — duplicated logic is acceptable.
 */
async function computeVehicleCosts(): Promise<Record<string, number>> {
  const fuelAgg = await prisma.fuelLog.groupBy({
    by: ['vehicleId'],
    _sum: { cost: true },
  });
  const maintAgg = await prisma.maintenanceRecord.groupBy({
    by: ['vehicleId'],
    _sum: { cost: true },
  });
  const expenseAgg = await prisma.expense.groupBy({
    by: ['vehicleId'],
    _sum: { total: true },
  });

  const costMap: Record<string, number> = {};

  for (const row of fuelAgg) {
    costMap[row.vehicleId] = (costMap[row.vehicleId] || 0) + (row._sum.cost || 0);
  }
  for (const row of maintAgg) {
    costMap[row.vehicleId] = (costMap[row.vehicleId] || 0) + (row._sum.cost || 0);
  }
  for (const row of expenseAgg) {
    costMap[row.vehicleId] = (costMap[row.vehicleId] || 0) + (row._sum.total || 0);
  }

  return costMap;
}

/**
 * Build a Prisma `where` clause from the optional KPI filters.
 */
function buildVehicleWhere(filters: KpiQueryInput): any {
  const where: any = {};
  if (filters.vehicleType && filters.vehicleType !== 'all') {
    where.type = filters.vehicleType;
  }
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status;
  }
  if (filters.region && filters.region !== 'all') {
    where.region = filters.region;
  }
  return where;
}

// ── Dashboard Endpoints ─────────────────────────────────────────────────────

export async function getKpis(filters: KpiQueryInput, userRole?: string) {
  const vehicleWhere = buildVehicleWhere(filters);

  const allVehicles = await prisma.vehicle.findMany({ where: vehicleWhere });
  const activeTripsCount = await prisma.trip.count({ where: { status: 'DISPATCHED' } });
  const pendingTripsCount = await prisma.trip.count({ where: { status: 'DRAFT' } });
  const driversOnDuty = await prisma.driver.count({ where: { status: 'ON_TRIP' } });

  const activeVehicles = allVehicles.filter(v => v.status === 'ON_TRIP').length;
  const availableVehicles = allVehicles.filter(v => v.status === 'AVAILABLE').length;
  const vehiclesInMaintenance = allVehicles.filter(v => v.status === 'IN_SHOP').length;
  const nonRetired = allVehicles.filter(v => v.status !== 'RETIRED').length;
  const fleetUtilizationPct = nonRetired > 0
    ? Math.round((activeVehicles / nonRetired) * 1000) / 10
    : 0;

  const fullResult = {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips: activeTripsCount,
    pendingTrips: pendingTripsCount,
    driversOnDuty,
    fleetUtilizationPct,
  };

  // Role-based response shaping per RBAC matrix
  if (userRole === 'DISPATCHER') {
    return {
      activeTrips: fullResult.activeTrips,
      pendingTrips: fullResult.pendingTrips,
      driversOnDuty: fullResult.driversOnDuty,
    };
  }
  if (userRole === 'FINANCIAL_ANALYST') {
    return {
      fleetUtilizationPct: fullResult.fleetUtilizationPct,
    };
  }
  if (userRole === 'SAFETY_OFFICER') {
    return {
      driversOnDuty: fullResult.driversOnDuty,
      activeVehicles: fullResult.activeVehicles,
    };
  }

  // FLEET_MANAGER (and fallback) sees everything
  return fullResult;
}

export async function getRecentTrips() {
  return prisma.trip.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      driver: { select: { id: true, name: true } },
    },
  });
}

export async function getVehicleStatusBreakdown() {
  const counts = await prisma.vehicle.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const breakdown: Record<string, number> = {
    AVAILABLE: 0,
    ON_TRIP: 0,
    IN_SHOP: 0,
    RETIRED: 0,
  };

  for (const row of counts) {
    breakdown[row.status] = row._count.id;
  }

  return Object.entries(breakdown).map(([status, count]) => ({
    status,
    count,
  }));
}

// ── Analytics Endpoints ────────────────────────────────────────────────────

export async function getSummary(userRole?: string) {
  // Fuel efficiency: total completed trip distance / total fuel liters
  const completedTrips = await prisma.trip.findMany({
    where: { status: 'COMPLETED' },
    select: { actualDistanceKm: true },
  });
  const totalDistance = completedTrips.reduce(
    (sum, t) => sum + (t.actualDistanceKm || 0),
    0
  );

  const fuelAgg = await prisma.fuelLog.aggregate({ _sum: { liters: true } });
  const totalLiters = fuelAgg._sum.liters || 0;
  const fuelEfficiencyKmPerL = totalLiters > 0
    ? Math.round((totalDistance / totalLiters) * 100) / 100
    : 0;

  // Fleet utilization
  const allVehicles = await prisma.vehicle.findMany({ select: { status: true } });
  const nonRetired = allVehicles.filter(v => v.status !== 'RETIRED').length;
  const onTrip = allVehicles.filter(v => v.status === 'ON_TRIP').length;
  const fleetUtilizationPct = nonRetired > 0
    ? Math.round((onTrip / nonRetired) * 1000) / 10
    : 0;

  // Operational cost: sum of all fuel + maintenance + expenses
  const fuelCostAgg = await prisma.fuelLog.aggregate({ _sum: { cost: true } });
  const maintCostAgg = await prisma.maintenanceRecord.aggregate({ _sum: { cost: true } });
  const expenseCostAgg = await prisma.expense.aggregate({ _sum: { total: true } });
  const operationalCost =
    (fuelCostAgg._sum.cost || 0) +
    (maintCostAgg._sum.cost || 0) +
    (expenseCostAgg._sum.total || 0);

  // Vehicle ROI: average across vehicles of ((revenue - (maint + fuel)) / acquisitionCost) * 100
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, acquisitionCost: true },
  });
  const vehicleCostMap = await computeVehicleCosts();
  const tripRevenueAgg = await prisma.trip.groupBy({
    by: ['vehicleId'],
    where: { status: 'COMPLETED' },
    _sum: { revenue: true },
  });
  const revenueMap: Record<string, number> = {};
  for (const row of tripRevenueAgg) {
    if (row.vehicleId) {
      revenueMap[row.vehicleId] = row._sum.revenue || 0;
    }
  }

  let roiSum = 0;
  let roiCount = 0;
  for (const v of vehicles) {
    if (v.acquisitionCost > 0) {
      const revenue = revenueMap[v.id] || 0;
      const cost = vehicleCostMap[v.id] || 0;
      const roi = ((revenue - cost) / v.acquisitionCost) * 100;
      roiSum += roi;
      roiCount++;
    }
  }
  const vehicleRoiPct = roiCount > 0
    ? Math.round((roiSum / roiCount) * 10) / 10
    : 0;

  const result: Record<string, any> = {};

  // Role-based response shaping per RBAC matrix
  if (userRole === 'FLEET_MANAGER' || userRole === 'FINANCIAL_ANALYST') {
    result.fuelEfficiencyKmPerL = fuelEfficiencyKmPerL;
    result.fleetUtilizationPct = fleetUtilizationPct;
    result.operationalCost = operationalCost;
    result.vehicleRoiPct = vehicleRoiPct;
  } else if (userRole === 'DISPATCHER') {
    result.fleetUtilizationPct = fleetUtilizationPct;
  } else if (userRole === 'SAFETY_OFFICER') {
    result.fleetUtilizationPct = fleetUtilizationPct;
  } else {
    // Fallback: return all
    result.fuelEfficiencyKmPerL = fuelEfficiencyKmPerL;
    result.fleetUtilizationPct = fleetUtilizationPct;
    result.operationalCost = operationalCost;
    result.vehicleRoiPct = vehicleRoiPct;
  }

  return result;
}

export async function getMonthlyRevenue() {
  // Last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const trips = await prisma.trip.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: sixMonthsAgo },
    },
    select: { revenue: true, completedAt: true },
  });

  // Build a map of the last 6 months
  const monthMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const shortKey = d.toLocaleString('en-US', { month: 'short' });
    monthMap[shortKey] = 0;
  }

  for (const trip of trips) {
    if (trip.completedAt && trip.revenue) {
      const month = trip.completedAt.toLocaleString('en-US', { month: 'short' });
      if (monthMap[month] !== undefined) {
        monthMap[month] += trip.revenue;
      }
    }
  }

  return Object.entries(monthMap).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

export async function getTopCostlyVehicles() {
  const vehicleCostMap = await computeVehicleCosts();

  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, regNo: true, name: true },
  });

  return vehicles
    .map(v => ({
      ...v,
      cost: vehicleCostMap[v.id] || 0,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);
}

export async function getExportCsvData() {
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: { select: { regNo: true, name: true } },
      driver: { select: { name: true } },
      expenses: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate fuel costs by trip
  const fuelCostsByTrip = await prisma.fuelLog.groupBy({
    by: ['tripId'],
    where: { tripId: { not: null } },
    _sum: { cost: true },
  });
  const fuelMap: Record<string, number> = {};
  for (const row of fuelCostsByTrip) {
    if (row.tripId) fuelMap[row.tripId] = row._sum.cost || 0;
  }

  return trips.map(t => {
    const fuelCost = fuelMap[t.id] || 0;
    const expenseTotal = t.expenses.reduce((s, e) => s + e.total, 0);
    const totalCost = fuelCost + expenseTotal;
    return {
      id: t.id,
      source: t.source,
      destination: t.destination,
      vehicle: t.vehicle?.regNo || '',
      driver: t.driver?.name || '',
      status: t.status,
      cargoWeightKg: t.cargoWeightKg,
      plannedDistanceKm: t.plannedDistanceKm,
      revenue: t.revenue || 0,
      fuelCost,
      expenseCost: expenseTotal,
      totalCost,
    };
  });
}

export function formatCsv(data: any[]): string {
  if (data.length === 0) return 'No data';

  const headers = Object.keys(data[0]);
  const lines = [headers.join(',')];

  for (const row of data) {
    const vals = headers.map(h => {
      const v = row[h];
      let s = String(v ?? '');
      // Escape double quotes and wrap in quotes if contains comma, quote, or newline
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        s = s.replace(/"/g, '""');
        s = `"${s}"`;
      }
      return s;
    });
    lines.push(vals.join(','));
  }

  return lines.join('\n');
}
