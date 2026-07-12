import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getSummary(req.user?.role);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getMonthlyRevenue();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getTopCostlyVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getTopCostlyVehicles();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getExportCsvData();
    const csv = analyticsService.formatCsv(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}
