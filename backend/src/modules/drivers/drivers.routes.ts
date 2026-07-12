import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as driverController from './drivers.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/drivers/available — critical endpoint for Trip module dispatch dropdown
router.get('/available', requireRole('SAFETY_OFFICER', 'FLEET_MANAGER', 'DISPATCHER'), driverController.getAvailable);

// GET /api/drivers — list all drivers (open to SAFETY_OFFICER, FLEET_MANAGER, DISPATCHER)
router.get('/', requireRole('SAFETY_OFFICER', 'FLEET_MANAGER', 'DISPATCHER'), driverController.list);

// GET /api/drivers/:id — single driver detail
router.get('/:id', requireRole('SAFETY_OFFICER', 'FLEET_MANAGER', 'DISPATCHER'), driverController.getById);

// POST /api/drivers — create driver (SAFETY_OFFICER only)
router.post('/', requireRole('SAFETY_OFFICER'), driverController.create);

// PATCH /api/drivers/:id — update driver (SAFETY_OFFICER only)
router.patch('/:id', requireRole('SAFETY_OFFICER'), driverController.update);

// DELETE /api/drivers/:id — delete driver (SAFETY_OFFICER only)
router.delete('/:id', requireRole('SAFETY_OFFICER'), driverController.remove);

// Email reminders for expiring licenses — FLEET_MANAGER or SAFETY_OFFICER
router.post('/reminders/expiring-licenses', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), driverController.sendLicenseReminders);

export default router;
