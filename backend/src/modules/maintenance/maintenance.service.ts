import { prisma } from '../../db/prisma/client';
import { ConflictError, NotFoundError } from '../../utils/errors';
import type { CreateMaintenanceLogInput, UpdateMaintenanceLogInput, MaintenanceQuery } from './maintenance.schema';

export async function listMaintenanceLogs(query: MaintenanceQuery) {
  const where: any = {};

  if (query.vehicleId) {
    where.vehicleId = query.vehicleId;
  }

  if (query.status) {
    where.status = query.status;
  }

  const logs = await prisma.maintenanceRecord.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, regNo: true, name: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  return logs;
}

export async function createMaintenanceLog(input: CreateMaintenanceLogInput) {
  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // If creating as ACTIVE, must set vehicle to IN_SHOP in same transaction
  if (input.status === 'ACTIVE') {
    const [log] = await prisma.$transaction([
      prisma.maintenanceRecord.create({
        data: {
          vehicleId: input.vehicleId,
          serviceType: input.serviceType,
          cost: input.cost,
          date: input.date,
          status: 'ACTIVE',
        },
      }),
      prisma.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: 'IN_SHOP' },
      }),
    ]);

    return log;
  }

  // Creating as COMPLETED directly — just create the log
  const log = await prisma.maintenanceRecord.create({
    data: {
      vehicleId: input.vehicleId,
      serviceType: input.serviceType,
      cost: input.cost,
      date: input.date,
      status: input.status as any,
    },
  });

  return log;
}

export async function updateMaintenanceLog(id: string, input: UpdateMaintenanceLogInput) {
  const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Maintenance log not found');
  }

  // If closing from ACTIVE → COMPLETED, handle vehicle status transition
  if (input.status === 'COMPLETED' && existing.status === 'ACTIVE') {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: existing.vehicleId } });
    if (!vehicle) {
      throw new NotFoundError('Associated vehicle not found');
    }

    // Block closing if vehicle is ON_TRIP
    if (vehicle.status === 'ON_TRIP') {
      throw new ConflictError(
        'Cannot close maintenance while vehicle is on a trip. Complete the trip first.',
        'VEHICLE_ON_TRIP'
      );
    }

    const data: any = { status: 'COMPLETED' };
    if (input.serviceType !== undefined) data.serviceType = input.serviceType;
    if (input.cost !== undefined) data.cost = input.cost;
    if (input.date !== undefined) data.date = input.date;

    // In transaction: update log + set vehicle back to AVAILABLE (unless RETIRED)
    const [log] = await prisma.$transaction([
      prisma.maintenanceRecord.update({ where: { id }, data }),
      prisma.vehicle.update({
        where: { id: existing.vehicleId },
        data: {
          status: vehicle.status === 'RETIRED' ? 'RETIRED' : 'AVAILABLE',
        },
      }),
    ]);

    return log;
  }

  // Generic update (not a status transition)
  const data: any = {};
  if (input.serviceType !== undefined) data.serviceType = input.serviceType;
  if (input.cost !== undefined) data.cost = input.cost;
  if (input.date !== undefined) data.date = input.date;
  if (input.status !== undefined) data.status = input.status;

  const log = await prisma.maintenanceRecord.update({ where: { id }, data });
  return log;
}

export async function deleteMaintenanceLog(id: string) {
  const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Maintenance log not found');
  }

  // Only allow deleting COMPLETED logs
  if (existing.status !== 'COMPLETED') {
    throw new ConflictError(
      'Cannot delete an active maintenance log. Close the maintenance record first.',
      'MAINTENANCE_ACTIVE'
    );
  }

  await prisma.maintenanceRecord.delete({ where: { id } });
  return { id };
}
