import { Request, Response, NextFunction } from 'express';
import { createMaintenanceLogSchema, updateMaintenanceLogSchema, maintenanceQuerySchema } from './maintenance.schema';
import * as maintenanceService from './maintenance.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = maintenanceQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const logs = await maintenanceService.listMaintenanceLogs(parsed.data);
    return sendSuccess(res, logs);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createMaintenanceLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const log = await maintenanceService.createMaintenanceLog(parsed.data);
    return sendSuccess(res, log, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateMaintenanceLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const log = await maintenanceService.updateMaintenanceLog(req.params.id, parsed.data);
    return sendSuccess(res, log);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await maintenanceService.deleteMaintenanceLog(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}
