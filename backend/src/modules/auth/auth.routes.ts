import { Router } from 'express';
import * as authController from './auth.controller';

const router = Router();

// POST /api/auth/register — create a new account
router.post('/register', authController.register);

// POST /api/auth/login — authenticate and get JWT token
router.post('/login', authController.login);

// POST /api/auth/logout — client-side token discard (stateless)
router.post('/logout', authController.logout);

export default router;
