import { prisma } from '../../db/prisma/client';
import type { KpiQueryInput } from './dashboard.schema';

// Map frontend-friendly filter values to Prisma enum values
const VEHICLE_TYPE_MAP: Record<string, string> = {
  'heavy': 'Heavy Truck',
  'medium': 'Medium Truck',
  'light': 'Light Van',
};

const STATUS_MAP: Record<string, string> = {
  'available': 'AVAILABLE',
  'on-trip': 'ON_TRIP',
  'in-shop': 'IN_SHOP',
  'retired': 'RETIRED',
};

function buildVehicleWhere(filters: KpiQueryInput): any {
  const where: any = {};
  if (filters.vehicleType && filters.vehicleType !== 'all') {
    where.type = VEHICLE_TYPE_MAP[filters.vehicleType] || filters.vehicleType;
  }
  if (filters.status && filters.status !== 'all') {
    where.status = STATUS_MAP[filters.status] || filters.status;
  }
  if (filters.region && filters.region !== 'all') {
    where.region = filters.region;
  }
  return where;
}

export async function getKpis(filters: KpiQueryInput, userRole?: string) {
  const vehicleWhere = buildVehicleWhere(filters);

  // Compute all KPIs but return role-filtered response
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

  // Base result has all fields
  const result = {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips: activeTripsCount,
    pendingTrips: pendingTripsCount,
    driversOnDuty,
    fleetUtilizationPct,
  };

  // Role-based response shaping
  if (userRole === 'DISPATCHER') {
    return {
      activeTrips: result.activeTrips,
      pendingTrips: result.pendingTrips,
      driversOnDuty: result.driversOnDuty,
    };
  }
  if (userRole === 'FINANCIAL_ANALYST') {
    return {
      fleetUtilizationPct: result.fleetUtilizationPct,
    };
  }
  if (userRole === 'SAFETY_OFFICER') {
    return {
      driversOnDuty: result.driversOnDuty,
      activeVehicles: result.activeVehicles,
    };
  }

  // Fleet Manager sees everything
  return result;
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
