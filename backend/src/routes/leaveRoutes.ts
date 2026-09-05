import { Router } from "express";
import { LeaveController } from "../controllers/leaveController.js";
import { domainValidation } from "../middleware/domainValidation.js";
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
router.get("/types", optionalAuth, LeaveController.getTimeOffTypes);
router.post(
  "/types",
  optionalAuth,
  domainValidation({ body: createTimeOffTypeSchema }),
  LeaveController.createTimeOffType
);

// Allocations
router.get("/allocations", optionalAuth, LeaveController.getAllocations);
router.post(
  "/allocations",
  optionalAuth,
  domainValidation({ body: createAllocationSchema }),
  LeaveController.createAllocation
);

// Balances
router.get("/balance/:employeeId", optionalAuth, LeaveController.getTimeOffBalance);

// Requests
router.get(
  "/requests",
  optionalAuth,
  domainValidation({ query: timeOffRequestQuerySchema }),
  LeaveController.getRequests
);

router.post(
  "/requests",
  optionalAuth,
  domainValidation({ body: createTimeOffRequestSchema }),
  LeaveController.createRequest
);

router.post("/requests/:id/approve", optionalAuth, LeaveController.approveRequest);

router.post(
  "/requests/:id/reject",
  optionalAuth,
  domainValidation({ body: rejectTimeOffSchema }),
  LeaveController.rejectRequest
);

export default router;
