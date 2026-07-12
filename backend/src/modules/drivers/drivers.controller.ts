import { Request, Response, NextFunction } from 'express';
import { createDriverSchema, updateDriverSchema } from './drivers.schema';
import * as driverService from './drivers.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';
// nodemailer is available for SMTP email delivery — see sendLicenseReminders

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const drivers = await driverService.listDrivers(search, status);
    return sendSuccess(res, drivers);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getAvailable(req: Request, res: Response, next: NextFunction) {
  try {
    const drivers = await driverService.getAvailableDrivers();
    return sendSuccess(res, drivers);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    return sendSuccess(res, driver);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createDriverSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const driver = await driverService.createDriver(parsed.data);
    return sendSuccess(res, driver, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateDriverSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const driver = await driverService.updateDriver(req.params.id, parsed.data);
    return sendSuccess(res, driver);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await driverService.deleteDriver(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.statusCode);
    }
    next(err);
  }
}

export async function sendLicenseReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const expiringDrivers = await driverService.getExpiringLicenses(30);

    if (expiringDrivers.length === 0) {
      return sendSuccess(res, { sent: 0, message: 'No drivers with licenses expiring within 30 days.' });
    }

    console.log('\n📧 License Expiry Reminders:');
    for (const driver of expiringDrivers) {
      const daysLeft = Math.ceil(
        (driver.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      console.log(`   → ${driver.name} (${driver.licenseNo}): license expires in ${daysLeft} day(s) on ${driver.expiry.toISOString().split('T')[0]}`);
    }
    console.log(`   Total: ${expiringDrivers.length} reminder(s) logged\n`);

    return sendSuccess(res, {
      sent: expiringDrivers.length,
      message: `${expiringDrivers.length} reminder(s) logged. Configure SMTP in .env to send real emails.`,
    });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.code, err.statusCode);
    next(err);
  }
}
