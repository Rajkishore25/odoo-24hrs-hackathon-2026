import { Request, Response, NextFunction } from "express";
import { SalaryService } from "../services/salaryService.js";
import { sendSuccess } from "../utils/response.js";

export class SalaryController {
  static async getStructures(req: Request, res: Response, next: NextFunction) {
    try {
      const structures = await SalaryService.getStructures();
      return sendSuccess(res, structures);
    } catch (error) {
      next(error);
    }
  }

  static async getStructureById(req: Request, res: Response, next: NextFunction) {
    try {
      const structure = await SalaryService.getStructureById(req.params.id as string);
      return sendSuccess(res, structure);
    } catch (error) {
      next(error);
    }
  }

  static async createStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const structure = await SalaryService.createStructure(req.body, req.user?.id);
      return sendSuccess(res, structure, "Salary structure created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await SalaryService.updateStructure(req.params.id as string, req.body, req.user?.id);
      return sendSuccess(res, updated, "Salary structure updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getRules(req: Request, res: Response, next: NextFunction) {
    try {
      const structureId = req.query.structureId as string | undefined;
      const rules = await SalaryService.getRules(structureId);
      return sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  }

  static async createRule(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await SalaryService.createRule(req.body, req.user?.id);
      return sendSuccess(res, rule, "Salary rule created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateRule(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await SalaryService.updateRule(req.params.id as string, req.body, req.user?.id);
      return sendSuccess(res, updated, "Salary rule updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteRule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalaryService.deleteRule(req.params.id as string, req.user?.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default SalaryController;
