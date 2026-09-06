import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { loginSchema, createAccountSchema, changePasswordSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

// Public
router.post('/login', validateBody(loginSchema), authController.login);

// Authenticated
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

// Account management — SUPER_ADMIN and HR_MANAGER only
router.post(
  '/create-account',
  authenticate,
  requireRole('SUPER_ADMIN', 'HR_MANAGER'),
  validateBody(createAccountSchema),
  authController.createAccount,
);

// Change own password — any authenticated user
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword,
);

export default router;
