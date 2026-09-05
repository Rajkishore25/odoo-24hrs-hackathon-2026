import { Router } from "express";
import { ScheduleController } from "../controllers/scheduleController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createScheduleSchema,
  updateScheduleSchema,
  expectedHoursQuerySchema,
} from "../validations/scheduleValidation.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, ScheduleController.getSchedules);

router.get("/:id", optionalAuth, ScheduleController.getScheduleById);

router.post(
  "/",
  optionalAuth,
  validateRequest({ body: createScheduleSchema }),
  ScheduleController.createSchedule
);

router.patch(
  "/:id",
  optionalAuth,
  validateRequest({ body: updateScheduleSchema }),
  ScheduleController.updateSchedule
);

router.get(
  "/:id/expected-hours",
  optionalAuth,
  validateRequest({ query: expectedHoursQuerySchema }),
  ScheduleController.getExpectedHours
);

export default router;
