import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.schema';
import * as ctrl from './employees.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), ctrl.listEmployees);
router.get('/:id', requireRole('HR_MANAGER', 'PAYROLL_OFFICER', 'LINE_MANAGER'), ctrl.getEmployee);
router.post('/', requireRole('HR_MANAGER'), validateBody(createEmployeeSchema), ctrl.createEmployee);
router.patch('/:id', requireRole('HR_MANAGER'), validateBody(updateEmployeeSchema), ctrl.updateEmployee);
router.delete('/:id', requireRole('HR_MANAGER'), ctrl.archiveEmployee);

export default router;
