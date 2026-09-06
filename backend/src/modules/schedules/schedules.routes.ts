import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { createScheduleSchema, updateScheduleSchema } from './schedules.schema';
import * as ctrl from './schedules.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listSchedules);
router.get('/:id', ctrl.getSchedule);
router.get('/:id/expected-hours', ctrl.getExpectedHours);
router.post('/', requireRole('HR_MANAGER'), validateBody(createScheduleSchema), ctrl.createSchedule);
router.patch('/:id', requireRole('HR_MANAGER'), validateBody(updateScheduleSchema), ctrl.updateSchedule);

export default router;
