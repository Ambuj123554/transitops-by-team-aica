import { Request, Response, NextFunction } from 'express';
import { createTripSchema, dispatchTripSchema, completeTripSchema } from './trips.schema';
import * as tripService from './trips.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const trips = await tripService.listTrips(status);
    return sendSuccess(res, trips);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripService.getTripById(req.params.id);
    return sendSuccess(res, trip);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createTripSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map(e => e.message).join(', '));
    }

    const trip = await tripService.createTrip(parsed.data);
    return sendSuccess(res, trip, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function dispatch(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = dispatchTripSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map(e => e.message).join(', '));
    }

    const trip = await tripService.dispatchTrip(req.params.id, parsed.data);
    return sendSuccess(res, trip);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = completeTripSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map(e => e.message).join(', '));
    }

    const trip = await tripService.completeTrip(req.params.id, parsed.data);
    return sendSuccess(res, trip);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripService.cancelTrip(req.params.id);
    return sendSuccess(res, trip);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tripService.deleteTrip(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}
