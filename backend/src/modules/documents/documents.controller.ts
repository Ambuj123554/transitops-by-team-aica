import { Request, Response, NextFunction } from 'express';
import { createDocumentSchema } from './documents.schema';
import * as documentService from './documents.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleId = req.query.vehicleId as string | undefined;
    const docs = await documentService.listDocuments(vehicleId);
    return sendSuccess(res, docs);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await documentService.getDocumentById(req.params.id);
    return sendSuccess(res, doc);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.code, err.statusCode);
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map(e => e.message).join(', '));
    }
    const doc = await documentService.createDocument(parsed.data);
    return sendSuccess(res, doc, 201);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.code, err.statusCode);
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await documentService.deleteDocument(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.code, err.statusCode);
    next(err);
  }
}
