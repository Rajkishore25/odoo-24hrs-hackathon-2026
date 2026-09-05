import { Router } from "express";
import { TimeOffController } from "../controllers/timeOffController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createTimeOffTypeSchema,
  createAllocationSchema,
  createTimeOffRequestSchema,
  rejectTimeOffSchema,
  timeOffRequestQuerySchema,
} from "../validations/timeOffValidation.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Types
router.get("/types", optionalAuth, TimeOffController.getTimeOffTypes);
router.post(
  "/types",
  optionalAuth,
  validateRequest({ body: createTimeOffTypeSchema }),
  TimeOffController.createTimeOffType
);

// Allocations
router.get("/allocations", optionalAuth, TimeOffController.getAllocations);
router.post(
  "/allocations",
  optionalAuth,
  validateRequest({ body: createAllocationSchema }),
  TimeOffController.createAllocation
);

// Balances
router.get("/balance/:employeeId", optionalAuth, TimeOffController.getTimeOffBalance);

// Requests
router.get(
  "/requests",
  optionalAuth,
  validateRequest({ query: timeOffRequestQuerySchema }),
  TimeOffController.getRequests
);

router.post(
  "/requests",
  optionalAuth,
  validateRequest({ body: createTimeOffRequestSchema }),
  TimeOffController.createRequest
);

router.post("/requests/:id/approve", optionalAuth, TimeOffController.approveRequest);

router.post(
  "/requests/:id/reject",
  optionalAuth,
  validateRequest({ body: rejectTimeOffSchema }),
  TimeOffController.rejectRequest
);

export default router;
