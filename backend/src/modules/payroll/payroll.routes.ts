import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { createPayrunSchema } from './payroll.schema';
import * as ctrl from './payroll.controller';

const router = Router();

router.use(authenticate);

// List + create: Payroll Officer and above
router.get('/', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.listPayruns);
router.post('/', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), validateBody(createPayrunSchema), ctrl.createPayrun);

// Single payrun operations
router.get('/:id', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.getPayrun);
router.post('/:id/compute', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.computePayrun);
router.post('/:id/validate', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.validatePayrun);
router.post('/:id/finalize', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.finalizePayrun);
router.get('/:id/payslips', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.getPayrunPayslips);

// Delete: SUPER_ADMIN and HR_MANAGER only (not Payroll Officer alone)
router.delete('/:id', requireRole('SUPER_ADMIN', 'HR_MANAGER'), ctrl.deletePayrun);

export default router;
