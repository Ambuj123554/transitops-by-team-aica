import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import * as authService from './auth.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const result = await authService.register(parsed.data);
    return sendSuccess(res, result, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const result = await authService.login(parsed.data);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.logout();
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}
