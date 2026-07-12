import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  code = 'INTERNAL_ERROR',
  statusCode = 400
) {
  return res.status(statusCode).json({
    success: false,
    error: { message, code },
  });
}

export function sendValidationError(res: Response, message: string) {
  return sendError(res, message, 'VALIDATION_ERROR', 400);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized') {
  return sendError(res, message, 'UNAUTHORIZED', 401);
}

export function sendForbidden(res: Response, message = 'Forbidden') {
  return sendError(res, message, 'FORBIDDEN', 403);
}

export function sendNotFound(res: Response, message = 'Resource not found') {
  return sendError(res, message, 'NOT_FOUND', 404);
}

export function sendConflict(res: Response, message: string, code = 'CONFLICT') {
  return sendError(res, message, code, 409);
}
