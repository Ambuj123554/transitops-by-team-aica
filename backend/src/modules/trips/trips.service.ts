import { prisma } from '../../db/prisma/client';
import { NotFoundError, ConflictError } from '../../utils/errors';
import type { CreateTripInput, DispatchTripInput, CompleteTripInput } from './trips.schema';

export async function listTrips(status?: string) {
  const where: any = {};
  if (status) {
    where.status = status;
  }

  return prisma.trip.findMany({
    where,
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      driver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTripById(id: string) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      driver: { select: { id: true, name: true } },
      expenses: true,
    },
  });

  if (!trip) {
    throw new NotFoundError('Trip not found');
  }

  return trip;
}

export async function createTrip(input: CreateTripInput) {
  return prisma.trip.create({
    data: {
      source: input.source,
      destination: input.destination,
      cargoWeightKg: input.cargoWeightKg,
      plannedDistanceKm: input.plannedDistanceKm,
      vehicleId: input.vehicleId || null,
      driverId: input.driverId || null,
      status: 'DRAFT',
    },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      driver: { select: { id: true, name: true } },
    },
  });
}

export async function dispatchTrip(id: string, input: DispatchTripInput) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    throw new NotFoundError('Trip not found');
  }
  if (trip.status !== 'DRAFT') {
    throw new ConflictError(`Trip cannot be dispatched from status ${trip.status}. Only DRAFT trips can be dispatched.`, 'INVALID_TRIP_STATUS');
  }

  // Validate vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }
  if (vehicle.status !== 'AVAILABLE') {
    throw new ConflictError(
      `Vehicle ${vehicle.regNo} is ${vehicle.status.toLowerCase().replace('_', ' ')} and cannot be dispatched`,
      'VEHICLE_NOT_AVAILABLE'
    );
  }

  // Validate driver
  const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }
  if (driver.status !== 'AVAILABLE') {
    throw new ConflictError(
      `Driver ${driver.name} is ${driver.status.toLowerCase().replace('_', ' ')} and cannot be dispatched`,
      'DRIVER_NOT_AVAILABLE'
    );
  }
  if (new Date(driver.expiry) < new Date()) {
    throw new ConflictError(
      `Driver ${driver.name}'s license expired on ${driver.expiry.toISOString().split('T')[0]}`,
      'DRIVER_NOT_AVAILABLE'
    );
  }

  // Validate cargo capacity
  if (trip.cargoWeightKg > vehicle.capacity) {
    const overage = trip.cargoWeightKg - vehicle.capacity;
    throw new ConflictError(
      `Capacity exceeded by ${overage} kg. Vehicle max: ${vehicle.capacity} kg, cargo: ${trip.cargoWeightKg} kg`,
      'CAPACITY_EXCEEDED'
    );
  }

  // Atomic dispatch transaction
  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id },
      data: {
        status: 'DISPATCHED',
        dispatchedAt: new Date(),
        vehicleId: input.vehicleId,
        driverId: input.driverId,
      },
      include: {
        vehicle: { select: { id: true, regNo: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
    prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: 'ON_TRIP' },
    }),
    prisma.driver.update({
      where: { id: input.driverId },
      data: { status: 'ON_TRIP' },
    }),
  ]);

  return updatedTrip;
}

export async function completeTrip(id: string, input: CompleteTripInput) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    throw new NotFoundError('Trip not found');
  }
  if (trip.status !== 'DISPATCHED') {
    throw new ConflictError(
      `Trip cannot be completed from status ${trip.status}. Only DISPATCHED trips can be completed.`,
      'INVALID_TRIP_STATUS'
    );
  }

  const operations: any[] = [
    prisma.trip.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualDistanceKm: input.actualDistanceKm,
        revenue: input.revenue ?? null,
      },
      include: {
        vehicle: { select: { id: true, regNo: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
  ];

  // Create fuel log if fuel consumed was recorded
  if (input.fuelConsumedLiters != null && trip.vehicleId) {
    operations.push(
      prisma.fuelLog.create({
        data: {
          date: new Date(),
          liters: input.fuelConsumedLiters,
          cost: 0,
          vehicleId: trip.vehicleId,
          tripId: id,
        },
      })
    );
  }

  // Restore vehicle: set to AVAILABLE and update odometer
  if (trip.vehicleId) {
    operations.push(
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: 'AVAILABLE',
          odometer: input.finalOdometer,
        },
      })
    );
  }

  // Restore driver
  if (trip.driverId) {
    operations.push(
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: 'AVAILABLE' },
      })
    );
  }

  const results = await prisma.$transaction(operations);
  return results[0]; // Return the updated trip
}

export async function cancelTrip(id: string) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    throw new NotFoundError('Trip not found');
  }
  if (trip.status !== 'DRAFT' && trip.status !== 'DISPATCHED') {
    throw new ConflictError(
      `Trip cannot be cancelled from status ${trip.status}. Only DRAFT or DISPATCHED trips can be cancelled.`,
      'INVALID_TRIP_STATUS'
    );
  }

  const operations: any[] = [
    prisma.trip.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
      include: {
        vehicle: { select: { id: true, regNo: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
  ];

  // If trip was dispatched, restore vehicle and driver availability
  if (trip.status === 'DISPATCHED') {
    if (trip.vehicleId) {
      operations.push(
        prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: 'AVAILABLE' },
        })
      );
    }
    if (trip.driverId) {
      operations.push(
        prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: 'AVAILABLE' },
        })
      );
    }
  }

  const results = await prisma.$transaction(operations);
  return results[0];
}

export async function deleteTrip(id: string) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    throw new NotFoundError('Trip not found');
  }
  if (trip.status !== 'DRAFT') {
    throw new ConflictError('Only DRAFT trips can be deleted', 'INVALID_TRIP_STATUS');
  }

  await prisma.trip.delete({ where: { id } });
  return { id };
}
