import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/me  (protected)
router.get('/me', authMiddleware, authController.getMe);

export default router;
