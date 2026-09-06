import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import * as ctrl from './payslip.controller';

const router = Router();

router.use(authenticate);

router.get('/employee/:employeeId', ctrl.listPayslipsForEmployee);
router.get('/:id', ctrl.getPayslip);
router.get('/:id/pdf', ctrl.downloadPayslipPdf);

// Edit + delete: Payroll Officer, HR Manager, Super Admin (not plain Employees)
router.patch('/:id', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.updatePayslip);
router.delete('/:id', requireRole('PAYROLL_OFFICER', 'HR_MANAGER'), ctrl.deletePayslip);

export default router;
