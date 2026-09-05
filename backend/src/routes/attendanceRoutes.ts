import { Router } from "express";
import { AttendanceController } from "../controllers/attendanceController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  punchSchema,
  manualAttendanceSchema,
  attendanceQuerySchema,
  reviewExceptionSchema,
} from "../validations/attendanceValidation.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.post(
  "/check-in",
  optionalAuth,
  validateRequest({ body: punchSchema }),
  AttendanceController.checkIn
);
// Support both check-in and checkin routes from API spec
router.post(
  "/checkin",
  optionalAuth,
  validateRequest({ body: punchSchema }),
  AttendanceController.checkIn
);

router.post(
  "/check-out",
  optionalAuth,
  validateRequest({ body: punchSchema }),
  AttendanceController.checkOut
);
// Support both check-out and checkout routes from API spec
router.post(
  "/checkout",
  optionalAuth,
  validateRequest({ body: punchSchema }),
  AttendanceController.checkOut
);

router.get("/exceptions", optionalAuth, AttendanceController.getExceptions);

router.patch(
  "/exceptions/:id",
  optionalAuth,
  validateRequest({ body: reviewExceptionSchema }),
  AttendanceController.reviewException
);

router.get(
  "/",
  optionalAuth,
  validateRequest({ query: attendanceQuerySchema }),
  AttendanceController.getAttendance
);

router.post(
  "/",
  optionalAuth,
  validateRequest({ body: manualAttendanceSchema }),
  AttendanceController.createAttendance
);

export default router;
