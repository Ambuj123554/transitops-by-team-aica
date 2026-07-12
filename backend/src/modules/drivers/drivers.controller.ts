import { Request, Response, NextFunction } from 'express';
import { createDriverSchema, updateDriverSchema } from './drivers.schema';
import * as driverService from './drivers.service';
import { sendSuccess, sendValidationError, sendError } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';
import nodemailer from 'nodemailer';

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

    // Try sending real emails if SMTP is configured, otherwise log to console
    const smtpHost = process.env.SMTP_HOST;
    let sentCount = 0;

    if (smtpHost) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });

      for (const driver of expiringDrivers) {
        const daysLeft = Math.ceil(
          (driver.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        try {
          await transporter.sendMail({
            from: '"TransitOps" <noreply@transitops.com>',
            to: req.user?.email || 'admin@transitops.com',
            subject: `License Expiring Soon - ${driver.name}`,
            text: `Driver ${driver.name} (${driver.licenseNo}) has a license expiring in ${daysLeft} day(s) on ${driver.expiry.toISOString().split('T')[0]}.`,
          });
          sentCount++;
        } catch {
          console.error(`Failed to send email for ${driver.name}`);
        }
      }
    } else {
      // Console fallback
      console.log('\n📧 License Expiry Reminders (no SMTP configured):');
      for (const driver of expiringDrivers) {
        const daysLeft = Math.ceil(
          (driver.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        console.log(`   → ${driver.name} (${driver.licenseNo}): expires in ${daysLeft} day(s) on ${driver.expiry.toISOString().split('T')[0]}`);
      }
      console.log(`   Total: ${expiringDrivers.length} reminder(s)\n`);
      sentCount = expiringDrivers.length;
    }

    return sendSuccess(res, {
      sent: sentCount,
      message: `${sentCount} reminder(s) ${smtpHost ? 'sent via email' : 'logged to console'}. Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env for real emails.`,
    });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.code, err.statusCode);
    next(err);
  }
}
