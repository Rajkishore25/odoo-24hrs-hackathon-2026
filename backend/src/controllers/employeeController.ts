import { Request, Response, NextFunction } from "express";
import { EmployeeService } from "../services/employeeService.js";
import { sendSuccess } from "../utils/response.js";

export class EmployeeController {
  public static async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmployeeService.getEmployees(req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.getEmployeeById(req.params.id as string);
      return sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  }

  public static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.createEmployee(req.body, req.user?.id);
      return sendSuccess(res, employee, "Employee created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.updateEmployee(
        req.params.id as string,
        req.body,
        req.user?.id
      );
      return sendSuccess(res, employee, "Employee updated successfully");
    } catch (error) {
      next(error);
    }
  }

  public static async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.archiveEmployee(
        req.params.id as string,
        req.user?.id
      );
      return sendSuccess(res, employee, "Employee archived successfully");
    } catch (error) {
      next(error);
    }
  }
}
