import { prisma } from '../../db/prisma/client';
import type { KpiQueryInput } from './dashboard.schema';

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
