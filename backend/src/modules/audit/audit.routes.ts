import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import * as ctrl from './audit.controller';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'));

router.get('/', ctrl.listAuditLogs);

export default router;
