import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { sendError, sendSuccess } from './utils/apiResponse';
import {
  securityHeaders,
  responseCompression,
  authRateLimiter,
  apiRateLimiter,
  requestLogger,
} from './middleware/security';
import { prisma } from './db/prisma/client';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Performance Middleware ───────────────────────────────────────

app.use(securityHeaders);
app.use(responseCompression);
app.use(requestLogger);

// CORS — restrict in production
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://transitops.netlify.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' })); // Limit request body size

// ── Health Check ────────────────────────────────────────────────────────────

// Apply rate limiters
app.use('/api/auth', authRateLimiter);
app.use('/api', apiRateLimiter);

// ── Health Check (with database status) ─────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    // Quick DB connectivity check
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    return res.status(503).json({
      success: false,
      error: { message: 'Database connection failed', code: 'DB_DOWN' },
    });
  }
});

// ── Auto-loading Route Discovery ────────────────────────────────────────────
// Scan all module directories and mount their routes at /api/<module-name>

const modulesPath = path.join(__dirname, 'modules');

function discoverAndMountRoutes() {
  if (!fs.existsSync(modulesPath)) {
    console.warn('⚠️  No modules directory found at', modulesPath);
    return;
  }

  const moduleDirs = fs.readdirSync(modulesPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const moduleName of moduleDirs) {
    const moduleDir = path.join(modulesPath, moduleName);

    // Look for *.routes.ts or *.routes.js
    const files = fs.readdirSync(moduleDir);
    const routeFile = files.find(
      (f) => f.endsWith('.routes.ts') || f.endsWith('.routes.js')
    );

    if (!routeFile) {
      console.warn(`⚠️  No routes file found in modules/${moduleName}/ — skipping`);
      continue;
    }

    try {
      const routePath = path.join(moduleDir, routeFile);
      // Use require() which works with both .ts (via tsx) and .js (compiled)
      const router = require(routePath).default;

      if (router) {
        const apiPath = `/api/${moduleName}`;
        app.use(apiPath, router);
        console.log(`✅ Mounted ${apiPath} → modules/${moduleName}/${routeFile}`);
      }
    } catch (err) {
      console.error(`❌ Failed to load routes for ${moduleName}:`, err);
    }
  }
}

discoverAndMountRoutes();

// ── Global Error Handler ────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[FATAL] Unhandled error:', err);
  return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
});

// ── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 TransitOps API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
