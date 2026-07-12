import { Request, Response, NextFunction } from 'express';
import * as dashboardAnalyticsService from './dashboard-analytics.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

// ── Dashboard ───────────────────────────────────────────────────────────────

export async function getKpis(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      vehicleType: req.query.vehicleType as string | undefined,
      status: req.query.status as string | undefined,
      region: req.query.region as string | undefined,
    };
    const userRole = req.user?.role;
    const data = await dashboardAnalyticsService.getKpis(filters, userRole);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getRecentTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const trips = await dashboardAnalyticsService.getRecentTrips();
    return sendSuccess(res, trips);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleStatusBreakdown(req: Request, res: Response, next: NextFunction) {
  try {
    const breakdown = await dashboardAnalyticsService.getVehicleStatusBreakdown();
    return sendSuccess(res, breakdown);
  } catch (err) {
    next(err);
  }
}

// ── Analytics ───────────────────────────────────────────────────────────────

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardAnalyticsService.getSummary(req.user?.role);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardAnalyticsService.getMonthlyRevenue();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getTopCostlyVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardAnalyticsService.getTopCostlyVehicles();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardAnalyticsService.getExportCsvData();
    const csv = dashboardAnalyticsService.formatCsv(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}
