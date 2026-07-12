import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { sendError } from './utils/apiResponse';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
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
  console.error('Unhandled error:', err);
  return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
});

// ── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 TransitOps API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
