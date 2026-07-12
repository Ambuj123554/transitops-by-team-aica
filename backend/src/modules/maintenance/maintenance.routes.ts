import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as maintenanceController from './maintenance.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/maintenance — list all maintenance logs (FLEET_MANAGER, FINANCIAL_ANALYST)
router.get(
  '/',
  requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  maintenanceController.list
);

// POST /api/maintenance — create maintenance log (FLEET_MANAGER only)
router.post('/', requireRole('FLEET_MANAGER'), maintenanceController.create);

// PATCH /api/maintenance/:id — update/close maintenance (FLEET_MANAGER only)
router.patch('/:id', requireRole('FLEET_MANAGER'), maintenanceController.update);

// DELETE /api/maintenance/:id — delete completed maintenance (FLEET_MANAGER only)
router.delete('/:id', requireRole('FLEET_MANAGER'), maintenanceController.remove);

export default router;
