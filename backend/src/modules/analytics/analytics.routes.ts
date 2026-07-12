import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as analyticsController from './analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

router.get('/summary', analyticsController.getSummary);
router.get('/monthly-revenue', analyticsController.getMonthlyRevenue);
router.get('/top-costly-vehicles', analyticsController.getTopCostlyVehicles);
router.get('/export/csv', analyticsController.exportCsv);

export default router;
