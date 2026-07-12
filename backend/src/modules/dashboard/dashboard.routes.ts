import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './dashboard.controller';

const router = Router();

router.use(requireAuth);

// KPIs: open to all roles (RBAC filtering happens in service layer)
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

export default router;
