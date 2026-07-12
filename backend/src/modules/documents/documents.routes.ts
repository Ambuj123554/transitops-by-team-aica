import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './documents.controller';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), controller.list);
router.get('/:id', requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), controller.getById);
router.post('/', requireRole('FLEET_MANAGER'), controller.create);
router.delete('/:id', requireRole('FLEET_MANAGER'), controller.remove);

export default router;
