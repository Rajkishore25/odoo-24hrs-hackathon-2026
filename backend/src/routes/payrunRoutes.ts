import { Router } from "express";
import { PayrunController } from "../controllers/payrunController.js";
import { domainValidation } from "../middleware/domainValidation.js";
import { createPayrunSchema, payrunQuerySchema } from "../validations/payrunValidation.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  domainValidation({ query: payrunQuerySchema }),
  PayrunController.getPayruns
);

router.post(
  "/",
  optionalAuth,
  domainValidation({ body: createPayrunSchema }),
  PayrunController.createPayrun
);

router.get("/:id", optionalAuth, PayrunController.getPayrunById);
router.post("/:id/compute", optionalAuth, PayrunController.computePayrun);
router.post("/:id/validate", optionalAuth, PayrunController.validatePayrun);
router.post("/:id/finalize", optionalAuth, PayrunController.finalizePayrun);
router.get("/:id/payslips", optionalAuth, PayrunController.getPayrunPayslips);

export default router;
