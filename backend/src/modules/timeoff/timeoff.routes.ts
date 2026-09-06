import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { createTimeOffTypeSchema, createAllocationSchema, createRequestSchema, rejectRequestSchema } from './timeoff.schema';
import * as ctrl from './timeoff.controller';

const router = Router();

router.use(authenticate);

router.get('/types', ctrl.listTypes);
router.post('/types', requireRole('HR_MANAGER'), validateBody(createTimeOffTypeSchema), ctrl.createType);

router.get('/allocations', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), ctrl.listAllocations);
router.post('/allocations', requireRole('HR_MANAGER'), validateBody(createAllocationSchema), ctrl.createAllocation);

router.get('/requests', ctrl.listRequests);
router.post('/requests', validateBody(createRequestSchema), ctrl.createRequest);
router.post('/requests/:id/approve', requireRole('HR_MANAGER', 'LINE_MANAGER'), ctrl.approveRequest);
router.post('/requests/:id/reject', requireRole('HR_MANAGER', 'LINE_MANAGER'), validateBody(rejectRequestSchema), ctrl.rejectRequest);

router.get('/balance/:employeeId', ctrl.getBalance);

export default router;
