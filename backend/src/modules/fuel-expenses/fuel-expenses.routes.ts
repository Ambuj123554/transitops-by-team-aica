import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as fuelExpenseController from './fuel-expenses.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ── Fuel Logs ──────────────────────────────────────────────────────────────
// GET /api/fuel-expenses/fuel-logs — list fuel logs (FINANCIAL_ANALYST, FLEET_MANAGER)
router.get('/fuel-logs', requireRole('FINANCIAL_ANALYST', 'FLEET_MANAGER'), fuelExpenseController.getFuelLogs);

// POST /api/fuel-expenses/fuel-logs — create fuel log (FINANCIAL_ANALYST only)
router.post('/fuel-logs', requireRole('FINANCIAL_ANALYST'), fuelExpenseController.createFuelLog);

// ── Expenses ───────────────────────────────────────────────────────────────
// GET /api/fuel-expenses/expenses — list expenses (FINANCIAL_ANALYST, FLEET_MANAGER)
router.get('/expenses', requireRole('FINANCIAL_ANALYST', 'FLEET_MANAGER'), fuelExpenseController.getExpenses);

// POST /api/fuel-expenses/expenses — create expense (FINANCIAL_ANALYST only)
router.post('/expenses', requireRole('FINANCIAL_ANALYST'), fuelExpenseController.createExpense);

// ── Operational Cost ───────────────────────────────────────────────────────
// GET /api/fuel-expenses/operational-cost/:vehicleId — cost for specific vehicle
router.get('/operational-cost/:vehicleId', requireRole('FINANCIAL_ANALYST', 'FLEET_MANAGER'), fuelExpenseController.getOperationalCost);

// GET /api/fuel-expenses/operational-cost — fleet-wide cost summary
router.get('/operational-cost', requireRole('FINANCIAL_ANALYST', 'FLEET_MANAGER'), fuelExpenseController.getFleetOperationalCost);

export default router;
