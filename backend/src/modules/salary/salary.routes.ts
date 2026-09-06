import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { createStructureSchema, updateStructureSchema, createRuleSchema, updateRuleSchema } from './salary.schema';
import * as ctrl from './salary.controller';

const router = Router();

router.use(authenticate);

// Structures
router.get('/structures', ctrl.listStructures);
router.get('/structures/:id', ctrl.getStructure);
router.post('/structures', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), validateBody(createStructureSchema), ctrl.createStructure);
router.patch('/structures/:id', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), validateBody(updateStructureSchema), ctrl.updateStructure);

// Rules
router.get('/rules', ctrl.listRules);
router.post('/rules', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), validateBody(createRuleSchema), ctrl.createRule);
router.patch('/rules/:id', requireRole('HR_MANAGER', 'PAYROLL_OFFICER'), validateBody(updateRuleSchema), ctrl.updateRule);

export default router;
