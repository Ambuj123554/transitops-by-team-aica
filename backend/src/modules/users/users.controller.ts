import { Request, Response, NextFunction } from 'express';
import { updateProfileSchema } from './users.schema';
import * as userService from './users.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUserById(req.user!.id);
    return sendSuccess(res, user);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const user = await userService.updateProfile(req.user!.id, parsed.data);
    return sendSuccess(res, user);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}
