import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import type { Request, Response, NextFunction } from 'express';

/**
 * Helmet middleware — sets secure HTTP headers
 * Protects against: XSS, clickjacking, MIME sniffing, etc.
 */
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for API — enable if serving HTML
});

/**
 * Compression middleware — reduces response payload size
 * Uses gzip/brotli when supported by the client
 */
export const responseCompression = compression({
  level: 6, // Balanced compression ratio
  threshold: 1024, // Only compress responses > 1KB
});

/**
 * Rate limiter for auth endpoints (login/register)
 * Prevents brute-force and credential-stuffing attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

/**
 * General API rate limiter
 * Protects against DoS and excessive API usage
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please slow down.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

/**
 * Request logging middleware
 * Logs method, path, status code, and response time for observability
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const logLine = `${req.method} ${req.originalUrl} → ${statusCode} (${duration}ms)`;

    if (typeof console !== 'undefined') {
      const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      fn(`[${new Date().toISOString()}] ${logLine}`);
    }

    return originalEnd.apply(this, args as any);
  };

  next();
}
