import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as tripController from './trips.controller';

const router = Router();

// List trips — open to DISPATCHER, FLEET_MANAGER, SAFETY_OFFICER
router.get('/', requireAuth, requireRole('DISPATCHER', 'FLEET_MANAGER', 'SAFETY_OFFICER'), tripController.list);

// Get single trip — open to same roles
router.get('/:id', requireAuth, requireRole('DISPATCHER', 'FLEET_MANAGER', 'SAFETY_OFFICER'), tripController.getById);

// Create draft trip — DISPATCHER only
router.post('/', requireAuth, requireRole('DISPATCHER'), tripController.create);

// Request approval — DISPATCHER submits for approval
router.patch('/:id/request-approval', requireAuth, requireRole('DISPATCHER'), tripController.requestApproval);

// Approve trip — FLEET_MANAGER approves
router.patch('/:id/approve', requireAuth, requireRole('FLEET_MANAGER'), tripController.approve);

// Dispatch trip (core business logic) — DISPATCHER only (skip approval flow)
router.patch('/:id/dispatch', requireAuth, requireRole('DISPATCHER'), tripController.dispatch);

// Complete trip — DISPATCHER only
router.patch('/:id/complete', requireAuth, requireRole('DISPATCHER'), tripController.complete);

// Cancel trip — DISPATCHER or FLEET_MANAGER
router.patch('/:id/cancel', requireAuth, requireRole('DISPATCHER', 'FLEET_MANAGER'), tripController.cancel);

// Delete draft trip — DISPATCHER only
router.delete('/:id', requireAuth, requireRole('DISPATCHER'), tripController.remove);

export default router;
