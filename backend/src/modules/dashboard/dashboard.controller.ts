import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function getKpis(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      vehicleType: req.query.vehicleType as string | undefined,
      status: req.query.status as string | undefined,
      region: req.query.region as string | undefined,
    };
    const userRole = req.user?.role;
    const data = await dashboardService.getKpis(filters, userRole);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getRecentTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const trips = await dashboardService.getRecentTrips();
    return sendSuccess(res, trips);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleStatusBreakdown(req: Request, res: Response, next: NextFunction) {
  try {
    const breakdown = await dashboardService.getVehicleStatusBreakdown();
    return sendSuccess(res, breakdown);
  } catch (err) {
    next(err);
  }
}
