import { prisma } from '../../db/prisma/client';
import { ConflictError, NotFoundError } from '../../utils/errors';
import type { CreateDriverInput, UpdateDriverInput } from './drivers.schema';

export async function listDrivers(search?: string, status?: string) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { licenseNo: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  return drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    licenseNumber: driver.licenseNo,
    licenseCategory: driver.category,
    licenseExpiry: driver.expiry,
    contactNumber: driver.contact,
    tripCompletion: driver.tripCompletion,
    safetyScore: driver.safetyScore,
    status: driver.status,
    licenseExpired: driver.expiry < now,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  }));
}

export async function getDriverById(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });

  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  return {
    id: driver.id,
    name: driver.name,
    licenseNumber: driver.licenseNo,
    licenseCategory: driver.category,
    licenseExpiry: driver.expiry,
    contactNumber: driver.contact,
    tripCompletion: driver.tripCompletion,
    safetyScore: driver.safetyScore,
    status: driver.status,
    licenseExpired: driver.expiry < new Date(),
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

export async function getAvailableDrivers() {
  const now = new Date();

  const drivers = await prisma.driver.findMany({
    where: {
      status: 'AVAILABLE',
      expiry: { gte: now },
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
    orderBy: { name: 'asc' },
  });

  return drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    licenseCategory: driver.category,
  }));
}

export async function createDriver(input: CreateDriverInput) {
  // Check license number uniqueness
  const existing = await prisma.driver.findUnique({
    where: { licenseNo: input.licenseNumber },
  });

  if (existing) {
    throw new ConflictError('License number already exists', 'DUPLICATE_LICENSE');
  }

  const driver = await prisma.driver.create({
    data: {
      name: input.name,
      licenseNo: input.licenseNumber,
      category: input.licenseCategory,
      expiry: new Date(input.licenseExpiry),
      contact: input.contactNumber,
      safetyScore: input.safetyScore ?? 80,
      status: (input.status as any) ?? 'AVAILABLE',
    },
  });

  return {
    id: driver.id,
    name: driver.name,
    licenseNumber: driver.licenseNo,
    licenseCategory: driver.category,
    licenseExpiry: driver.expiry,
    contactNumber: driver.contact,
    tripCompletion: driver.tripCompletion,
    safetyScore: driver.safetyScore,
    status: driver.status,
    licenseExpired: driver.expiry < new Date(),
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

export async function updateDriver(id: string, input: UpdateDriverInput) {
  const existing = await prisma.driver.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Driver not found');
  }

  // Check license number uniqueness if being changed
  if (input.licenseNumber && input.licenseNumber !== existing.licenseNo) {
    const licenseExists = await prisma.driver.findUnique({
      where: { licenseNo: input.licenseNumber },
    });

    if (licenseExists) {
      throw new ConflictError('License number already exists', 'DUPLICATE_LICENSE');
    }
  }

  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.licenseNumber !== undefined) data.licenseNo = input.licenseNumber;
  if (input.licenseCategory !== undefined) data.category = input.licenseCategory;
  if (input.licenseExpiry !== undefined) data.expiry = new Date(input.licenseExpiry);
  if (input.contactNumber !== undefined) data.contact = input.contactNumber;
  if (input.safetyScore !== undefined) data.safetyScore = input.safetyScore;
  if (input.status !== undefined) data.status = input.status;

  const driver = await prisma.driver.update({
    where: { id },
    data,
  });

  return {
    id: driver.id,
    name: driver.name,
    licenseNumber: driver.licenseNo,
    licenseCategory: driver.category,
    licenseExpiry: driver.expiry,
    contactNumber: driver.contact,
    tripCompletion: driver.tripCompletion,
    safetyScore: driver.safetyScore,
    status: driver.status,
    licenseExpired: driver.expiry < new Date(),
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

export async function deleteDriver(id: string) {
  const existing = await prisma.driver.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Driver not found');
  }

  // Check if driver has any trips
  const tripCount = await prisma.trip.count({
    where: { driverId: id },
  });

  if (tripCount > 0) {
    throw new ConflictError(
      'Cannot delete driver with existing trip records. Consider suspending the driver instead.',
      'DRIVER_HAS_TRIPS'
    );
  }

  await prisma.driver.delete({ where: { id } });

  return { id };
}
