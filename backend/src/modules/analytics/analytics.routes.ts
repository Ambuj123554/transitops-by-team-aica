import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './analytics.controller';

const router = Router();

router.use(requireAuth);

// Summary: open to all roles (RBAC filtering happens in service layer)
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
