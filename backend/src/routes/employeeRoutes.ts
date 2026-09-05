import { Router } from "express";
import { EmployeeController } from "../controllers/employeeController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
} from "../validations/employeeValidation.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";

const router = Router();

// Allow optionalAuth in development or testing so endpoints are testable immediately
router.get(
  "/",
  optionalAuth,
  validateRequest({ query: employeeQuerySchema }),
  EmployeeController.getEmployees
);

router.get("/:id", optionalAuth, EmployeeController.getEmployeeById);

router.post(
  "/",
  optionalAuth,
  validateRequest({ body: createEmployeeSchema }),
  EmployeeController.createEmployee
);

router.patch(
  "/:id",
  optionalAuth,
  validateRequest({ body: updateEmployeeSchema }),
  EmployeeController.updateEmployee
);

router.delete("/:id", optionalAuth, EmployeeController.deleteEmployee);

export default router;
