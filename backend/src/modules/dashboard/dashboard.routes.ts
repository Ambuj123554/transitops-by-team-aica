import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as dashboardController from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication (role filtering is data-level, not route-level)
router.use(requireAuth);

router.get('/kpis', dashboardController.getKpis);
router.get('/recent-trips', dashboardController.getRecentTrips);
router.get('/vehicle-status-breakdown', dashboardController.getVehicleStatusBreakdown);

export default router;
