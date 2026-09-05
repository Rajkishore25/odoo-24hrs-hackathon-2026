import { Router } from "express";
import { SalaryController } from "../controllers/salaryController.js";
import { domainValidation } from "../middleware/domainValidation.js";
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
} from "../validations/salaryValidation.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Salary Structures
router.get("/salary-structures", optionalAuth, SalaryController.getStructures);
router.get("/salary-structures/:id", optionalAuth, SalaryController.getStructureById);
router.post(
  "/salary-structures",
  optionalAuth,
  domainValidation({ body: createSalaryStructureSchema }),
  SalaryController.createStructure
);
router.patch(
  "/salary-structures/:id",
  optionalAuth,
  domainValidation({ body: updateSalaryStructureSchema }),
  SalaryController.updateStructure
);

// Salary Rules
router.get("/salary-rules", optionalAuth, SalaryController.getRules);
router.post(
  "/salary-rules",
  optionalAuth,
  domainValidation({ body: createSalaryRuleSchema }),
  SalaryController.createRule
);
router.patch(
  "/salary-rules/:id",
  optionalAuth,
  domainValidation({ body: updateSalaryRuleSchema }),
  SalaryController.updateRule
);
router.delete("/salary-rules/:id", optionalAuth, SalaryController.deleteRule);

export default router;
