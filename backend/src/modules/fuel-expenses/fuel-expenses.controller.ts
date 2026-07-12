import { Request, Response, NextFunction } from 'express';
import { createFuelLogSchema, createExpenseSchema } from './fuel-expenses.schema';
import * as fuelExpenseService from './fuel-expenses.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function getFuelLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleId = req.query.vehicleId as string | undefined;
    const logs = await fuelExpenseService.listFuelLogs(vehicleId);
    return sendSuccess(res, logs);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function createFuelLog(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createFuelLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const log = await fuelExpenseService.createFuelLog(parsed.data);
    return sendSuccess(res, log, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleId = req.query.vehicleId as string | undefined;
    const expenses = await fuelExpenseService.listExpenses(vehicleId);
    return sendSuccess(res, expenses);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const expense = await fuelExpenseService.createExpense(parsed.data);
    return sendSuccess(res, expense, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getOperationalCost(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleId = req.params.vehicleId;
    const result = await fuelExpenseService.getOperationalCost(vehicleId);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getFleetOperationalCost(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await fuelExpenseService.getOperationalCost();
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}
