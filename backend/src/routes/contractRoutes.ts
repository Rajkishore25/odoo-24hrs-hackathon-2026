import { Router } from "express";
import { ContractController } from "../controllers/contractController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createContractSchema,
  updateContractSchema,
  applicableContractsQuerySchema,
} from "../validations/contractValidation.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/applicable", optionalAuth, validateRequest({ query: applicableContractsQuerySchema }), ContractController.getApplicableContracts);

router.get("/", optionalAuth, ContractController.getContracts);

router.get("/employee/:employeeId", optionalAuth, ContractController.getContractsByEmployeeId);

router.get("/:id", optionalAuth, ContractController.getContractById);

router.post(
  "/",
  optionalAuth,
  validateRequest({ body: createContractSchema }),
  ContractController.createContract
);

router.patch(
  "/:id",
  optionalAuth,
  validateRequest({ body: updateContractSchema }),
  ContractController.updateContract
);

export default router;
