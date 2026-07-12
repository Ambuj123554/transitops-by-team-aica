import { Request, Response, NextFunction } from 'express';
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema } from './vehicles.schema';
import * as vehicleService from './vehicles.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = vehicleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const vehicles = await vehicleService.listVehicles(parsed.data);
    return sendSuccess(res, vehicles);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getAvailable(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicles = await vehicleService.getAvailableVehicles();
    return sendSuccess(res, vehicles);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    return sendSuccess(res, vehicle);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const vehicle = await vehicleService.createVehicle(parsed.data);
    return sendSuccess(res, vehicle, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const vehicle = await vehicleService.updateVehicle(req.params.id, parsed.data);
    return sendSuccess(res, vehicle);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await vehicleService.deleteVehicle(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}
