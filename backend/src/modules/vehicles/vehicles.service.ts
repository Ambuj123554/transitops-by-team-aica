import { prisma } from '../../db/prisma/client';
import { ConflictError, NotFoundError } from '../../utils/errors';
import type { CreateVehicleInput, UpdateVehicleInput, VehicleQuery } from './vehicles.schema';

export async function listVehicles(query: VehicleQuery) {
  const where: any = {};

  if (query.search) {
    where.OR = [
      { regNo: { contains: query.search, mode: 'insensitive' as const } },
      { name: { contains: query.search, mode: 'insensitive' as const } },
    ];
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.region) {
    where.region = query.region;
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return vehicles;
}

export async function getVehicleById(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  return vehicle;
}

export async function getAvailableVehicles() {
  return prisma.vehicle.findMany({
    where: { status: 'AVAILABLE' },
    select: {
      id: true,
      regNo: true,
      name: true,
      capacity: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function createVehicle(input: CreateVehicleInput) {
  // Check registration number uniqueness
  const existing = await prisma.vehicle.findUnique({ where: { regNo: input.regNo } });
  if (existing) {
    throw new ConflictError(
      `Registration number "${input.regNo}" already exists`,
      'DUPLICATE_REGISTRATION'
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      regNo: input.regNo,
      name: input.name,
      type: input.type,
      capacity: input.capacity,
      odometer: input.odometer,
      acquisitionCost: input.acquisitionCost,
      region: input.region ?? null,
      status: (input.status as any) ?? 'AVAILABLE',
    },
  });

  return vehicle;
}

export async function updateVehicle(id: string, input: UpdateVehicleInput) {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Vehicle not found');
  }

  // Check registration number uniqueness if being changed
  if (input.regNo && input.regNo !== existing.regNo) {
    const regExists = await prisma.vehicle.findUnique({ where: { regNo: input.regNo } });
    if (regExists) {
      throw new ConflictError(
        `Registration number "${input.regNo}" already exists`,
        'DUPLICATE_REGISTRATION'
      );
    }
  }

  const data: any = {};
  if (input.regNo !== undefined) data.regNo = input.regNo;
  if (input.name !== undefined) data.name = input.name;
  if (input.type !== undefined) data.type = input.type;
  if (input.capacity !== undefined) data.capacity = input.capacity;
  if (input.odometer !== undefined) data.odometer = input.odometer;
  if (input.acquisitionCost !== undefined) data.acquisitionCost = input.acquisitionCost;
  if (input.region !== undefined) data.region = input.region;
  if (input.status !== undefined) data.status = input.status;

  const vehicle = await prisma.vehicle.update({ where: { id }, data });
  return vehicle;
}

export async function deleteVehicle(id: string) {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Vehicle not found');
  }

  // Check if vehicle has any trips, maintenance logs, or fuel logs
  const tripCount = await prisma.trip.count({ where: { vehicleId: id } });
  const maintCount = await prisma.maintenanceRecord.count({ where: { vehicleId: id } });
  const fuelCount = await prisma.fuelLog.count({ where: { vehicleId: id } });
  const expenseCount = await prisma.expense.count({ where: { vehicleId: id } });

  if (tripCount > 0 || maintCount > 0 || fuelCount > 0 || expenseCount > 0) {
    throw new ConflictError(
      'Cannot delete vehicle with existing records. Set status to RETIRED instead.',
      'VEHICLE_HAS_REFERENCES'
    );
  }

  await prisma.vehicle.delete({ where: { id } });
  return { id };
}
