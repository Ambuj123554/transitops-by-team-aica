import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as userController from './users.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/users/me — current user's profile
router.get('/me', userController.getMe);

// PATCH /api/users/me — update own name
router.patch('/me', userController.updateMe);

export default router;
