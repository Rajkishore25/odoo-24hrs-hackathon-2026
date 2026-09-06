import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { createContractSchema, updateContractSchema } from './contracts.schema';
import * as ctrl from './contracts.controller';

const router = Router();

router.use(authenticate);

router.get('/applicable', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), ctrl.getApplicableContracts);
router.post('/', requireRole('HR_MANAGER'), validateBody(createContractSchema), ctrl.createContract);
router.get('/:id', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), ctrl.getContract);
router.patch('/:id', requireRole('HR_MANAGER'), validateBody(updateContractSchema), ctrl.updateContract);

export default router;
