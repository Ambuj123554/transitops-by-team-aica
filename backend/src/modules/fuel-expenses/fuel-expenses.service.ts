import { prisma } from '../../db/prisma/client';
import { NotFoundError } from '../../utils/errors';
import type { CreateFuelLogInput, CreateExpenseInput } from './fuel-expenses.schema';

export async function listFuelLogs(vehicleId?: string) {
  const where: any = {};

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  const logs = await prisma.fuelLog.findMany({
    where,
    include: {
      vehicle: {
        select: {
          regNo: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return logs.map((log) => ({
    id: log.id,
    vehicleId: log.vehicleId,
    registrationNumber: log.vehicle.regNo,
    liters: log.liters,
    cost: log.cost,
    date: log.date,
    tripId: log.tripId,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  }));
}

export async function createFuelLog(input: CreateFuelLogInput) {
  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const log = await prisma.fuelLog.create({
    data: {
      vehicleId: input.vehicleId,
      liters: input.liters,
      cost: input.cost,
      date: new Date(input.date),
      tripId: input.tripId ?? null,
    },
    include: {
      vehicle: {
        select: {
          regNo: true,
        },
      },
    },
  });

  return {
    id: log.id,
    vehicleId: log.vehicleId,
    registrationNumber: log.vehicle.regNo,
    liters: log.liters,
    cost: log.cost,
    date: log.date,
    tripId: log.tripId,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

export async function listExpenses(vehicleId?: string) {
  const where: any = {};

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      vehicle: {
        select: {
          regNo: true,
        },
      },
      trip: {
        select: {
          id: true,
          source: true,
          destination: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return expenses.map((expense) => ({
    id: expense.id,
    vehicleId: expense.vehicleId,
    registrationNumber: expense.vehicle.regNo,
    tripId: expense.tripId,
    trip: expense.trip,
    tollCost: expense.toll,
    otherCost: expense.other,
    total: expense.total,
    maintLinked: expense.maintLinked,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  }));
}

export async function createExpense(input: CreateExpenseInput) {
  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const total = input.tollCost + input.otherCost;

  const expense = await prisma.expense.create({
    data: {
      vehicleId: input.vehicleId,
      tripId: input.tripId,
      toll: input.tollCost,
      other: input.otherCost,
      total,
    },
    include: {
      vehicle: {
        select: {
          regNo: true,
        },
      },
      trip: {
        select: {
          id: true,
          source: true,
          destination: true,
        },
      },
    },
  });

  return {
    id: expense.id,
    vehicleId: expense.vehicleId,
    registrationNumber: expense.vehicle.regNo,
    tripId: expense.tripId,
    trip: expense.trip,
    tollCost: expense.toll,
    otherCost: expense.other,
    total: expense.total,
    maintLinked: expense.maintLinked,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export async function getOperationalCost(vehicleId?: string) {
  const fuelWhere: any = {};
  const expenseWhere: any = {};
  const maintenanceWhere: any = { status: 'COMPLETED' as const };

  if (vehicleId) {
    fuelWhere.vehicleId = vehicleId;
    expenseWhere.vehicleId = vehicleId;
    maintenanceWhere.vehicleId = vehicleId;
  }

  // Aggregate fuel costs
  const fuelAgg = await prisma.fuelLog.aggregate({
    where: fuelWhere,
    _sum: { cost: true },
  });
  const fuelTotal = fuelAgg._sum.cost ?? 0;

  // Aggregate expense costs
  const expenseAgg = await prisma.expense.aggregate({
    where: expenseWhere,
    _sum: {
      toll: true,
      other: true,
    },
  });
  const expenseTotal = (expenseAgg._sum.toll ?? 0) + (expenseAgg._sum.other ?? 0);

  // Aggregate completed maintenance costs
  const maintenanceAgg = await prisma.maintenanceRecord.aggregate({
    where: maintenanceWhere,
    _sum: { cost: true },
  });
  const maintenanceTotal = maintenanceAgg._sum.cost ?? 0;

  const total = fuelTotal + maintenanceTotal + expenseTotal;

  const result: any = {
    fuelTotal,
    maintenanceTotal,
    expenseTotal,
    total,
  };

  if (vehicleId) {
    result.vehicleId = vehicleId;
  }

  return result;
}
