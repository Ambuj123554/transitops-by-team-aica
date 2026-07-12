import { prisma } from '../../db/prisma/client';

// ── Local helper (duplicated within module per spec guidance) ───────────────

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

// ── Endpoints ───────────────────────────────────────────────────────────────

export async function getSummary(userRole?: string) {
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

  const allVehicles = await prisma.vehicle.findMany({ select: { status: true } });
  const nonRetired = allVehicles.filter(v => v.status !== 'RETIRED').length;
  const onTrip = allVehicles.filter(v => v.status === 'ON_TRIP').length;
  const fleetUtilizationPct = nonRetired > 0
    ? Math.round((onTrip / nonRetired) * 1000) / 10
    : 0;

  const fuelCostAgg = await prisma.fuelLog.aggregate({ _sum: { cost: true } });
  const maintCostAgg = await prisma.maintenanceRecord.aggregate({ _sum: { cost: true } });
  const expenseCostAgg = await prisma.expense.aggregate({ _sum: { total: true } });
  const operationalCost =
    (fuelCostAgg._sum.cost || 0) +
    (maintCostAgg._sum.cost || 0) +
    (expenseCostAgg._sum.total || 0);

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
    result.fuelEfficiencyKmPerL = fuelEfficiencyKmPerL;
    result.fleetUtilizationPct = fleetUtilizationPct;
    result.operationalCost = operationalCost;
    result.vehicleRoiPct = vehicleRoiPct;
  }

  return result;
}

export async function getMonthlyRevenue() {
  const trips = await prisma.trip.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { not: null },
      revenue: { not: null },
    },
    select: { revenue: true, completedAt: true },
    orderBy: { completedAt: 'asc' },
  });

  // Group by month+year so "Dec 2023" and "Jan 2024" don't collide
  const monthMap: Record<string, { revenue: number; sortKey: number }> = {};

  for (const trip of trips) {
    if (trip.completedAt && trip.revenue) {
      const key = trip.completedAt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const sortKey = trip.completedAt.getTime();
      if (!monthMap[key]) {
        monthMap[key] = { revenue: 0, sortKey };
      }
      monthMap[key].revenue += trip.revenue;
    }
  }

  return Object.entries(monthMap)
    .sort(([, a], [, b]) => a.sortKey - b.sortKey)
    .map(([monthYear, { revenue }]) => ({
      month: monthYear.split(' ')[0],
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
