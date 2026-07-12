import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './dashboard-analytics.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ── Dashboard Routes ────────────────────────────────────────────────────────
// KPIs: open to all roles (RBAC filtering happens in the service layer)
router.get('/kpis', controller.getKpis);

// Recent trips: DISPATCHER, FLEET_MANAGER, SAFETY_OFFICER
router.get(
  '/recent-trips',
  requireRole('DISPATCHER', 'FLEET_MANAGER', 'SAFETY_OFFICER'),
  controller.getRecentTrips
);

// Vehicle status breakdown: FLEET_MANAGER
router.get(
  '/vehicle-status-breakdown',
  requireRole('FLEET_MANAGER'),
  controller.getVehicleStatusBreakdown
);

// ── Analytics Routes ────────────────────────────────────────────────────────
// Summary: open to all roles (RBAC filtering happens in the service layer)
router.get('/summary', controller.getSummary);

// Monthly revenue: FLEET_MANAGER, FINANCIAL_ANALYST
router.get(
  '/monthly-revenue',
  requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  controller.getMonthlyRevenue
);

// Top costly vehicles: FLEET_MANAGER, FINANCIAL_ANALYST
router.get(
  '/top-costly-vehicles',
  requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  controller.getTopCostlyVehicles
);

// CSV export: FLEET_MANAGER, FINANCIAL_ANALYST
router.get(
  '/export/csv',
  requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  controller.exportCsv
);

export default router;
