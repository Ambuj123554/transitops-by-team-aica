import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as vehicleController from './vehicles.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/vehicles/available — critical for Trip dispatch dropdown
// Must be placed before /:id to avoid matching 'available' as an id
router.get(
  '/available',
  requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'),
  vehicleController.getAvailable
);

// GET /api/vehicles — list all (read: FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST)
router.get(
  '/',
  requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'),
  vehicleController.list
);

// GET /api/vehicles/:id — single detail
router.get(
  '/:id',
  requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'),
  vehicleController.getById
);

// POST /api/vehicles — create (FLEET_MANAGER only)
router.post('/', requireRole('FLEET_MANAGER'), vehicleController.create);

// PATCH /api/vehicles/:id — update (FLEET_MANAGER only)
router.patch('/:id', requireRole('FLEET_MANAGER'), vehicleController.update);

// DELETE /api/vehicles/:id — delete (FLEET_MANAGER only)
router.delete('/:id', requireRole('FLEET_MANAGER'), vehicleController.remove);

export default router;
