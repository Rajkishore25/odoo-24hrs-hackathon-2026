import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { checkInSchema, checkOutSchema, createAttendanceSchema, updateAttendanceSchema, updateExceptionSchema } from './attendance.schema';
import * as ctrl from './attendance.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listAttendance);
router.post('/', requireRole('HR_MANAGER'), validateBody(createAttendanceSchema), ctrl.createAttendance);
router.post('/checkin', validateBody(checkInSchema), ctrl.checkIn);
router.post('/checkout', validateBody(checkOutSchema), ctrl.checkOut);
router.patch('/:id', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), validateBody(updateAttendanceSchema), ctrl.updateAttendance);
router.get('/exceptions', ctrl.listExceptions);
router.patch('/exceptions/:id', requireRole('HR_MANAGER', 'LINE_MANAGER'), validateBody(updateExceptionSchema), ctrl.updateException);

export default router;
