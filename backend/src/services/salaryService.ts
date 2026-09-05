import { db } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuditService } from "./auditService.js";
import { CreateSalaryStructureInput, CreateSalaryRuleInput } from "../validations/salaryValidation.js";

export class SalaryService {
  /**
   * List all salary structures with their associated rules.
   */
  static async getStructures() {
    return db.salaryStructure.findMany({
      where: { isActive: true },
      include: {
        rules: {
          where: { isActive: true },
          orderBy: { sequence: "asc" },
        },
        _count: {
          select: { contracts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single salary structure by ID.
   */
  static async getStructureById(id: string) {
    const structure = await db.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: {
          where: { isActive: true },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!structure) {
      throw new AppError("Salary structure not found", 404, "NOT_FOUND");
    }

    return structure;
  }

  /**
   * Create a new salary structure.
   */
  static async createStructure(input: CreateSalaryStructureInput, userId?: string) {
    const structure = await db.salaryStructure.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });

    await AuditService.log({
      userId,
      action: "SALARY_STRUCTURE_CREATED",
      entityType: "SalaryStructure",
      entityId: structure.id,
      newData: structure,
      reason: "Created new salary structure",
    });

    return structure;
  }

  /**
   * Update salary structure.
   */
  static async updateStructure(id: string, input: Partial<CreateSalaryStructureInput>, userId?: string) {
    const existing = await this.getStructureById(id);

    const updated = await db.salaryStructure.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });

    await AuditService.log({
      userId,
      action: "SALARY_STRUCTURE_UPDATED",
      entityType: "SalaryStructure",
      entityId: id,
      oldData: existing,
      newData: updated,
      reason: "Updated salary structure details",
    });

    return updated;
  }

  /**
   * Get salary rules for a given structure.
   */
  static async getRules(structureId?: string) {
    const where: any = { isActive: true };
    if (structureId) where.salaryStructureId = structureId;

    return db.salaryRule.findMany({
      where,
      orderBy: { sequence: "asc" },
      include: {
        salaryStructure: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Create a new salary rule with sequence and uniqueness validations.
   */
  static async createRule(input: CreateSalaryRuleInput, userId?: string) {
    const structure = await db.salaryStructure.findUnique({
      where: { id: input.salaryStructureId },
    });

    if (!structure) {
      throw new AppError("Referenced salary structure does not exist", 404, "NOT_FOUND");
    }

    const existingCode = await db.salaryRule.findFirst({
      where: {
        salaryStructureId: input.salaryStructureId,
        code: input.code.toUpperCase(),
        isActive: true,
      },
    });

    if (existingCode) {
      throw new AppError(
        `Rule with code '${input.code}' already exists in this salary structure`,
        409,
        "CONFLICT"
      );
    }

    const rule = await db.salaryRule.create({
      data: {
        salaryStructureId: input.salaryStructureId,
        name: input.name,
        code: input.code.toUpperCase(),
        category: input.category,
        sequence: input.sequence,
        calculationType: input.calculationType,
        value: input.value !== undefined ? input.value : null,
        dependsOnCode: input.dependsOnCode ? input.dependsOnCode.toUpperCase() : null,
        formulaDescription: input.formulaDescription || null,
      },
    });

    await AuditService.log({
      userId,
      action: "SALARY_RULE_CREATED",
      entityType: "SalaryRule",
      entityId: rule.id,
      newData: rule,
      reason: `Rule ${rule.code} added to ${structure.name}`,
    });

    return rule;
  }

  /**
   * Update a salary rule.
   */
  static async updateRule(id: string, input: Partial<CreateSalaryRuleInput>, userId?: string) {
    const existing = await db.salaryRule.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Salary rule not found", 404, "NOT_FOUND");
    }

    const updated = await db.salaryRule.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.category && { category: input.category }),
        ...(input.sequence !== undefined && { sequence: input.sequence }),
        ...(input.calculationType && { calculationType: input.calculationType }),
        ...(input.value !== undefined && { value: input.value }),
        ...(input.dependsOnCode !== undefined && { dependsOnCode: input.dependsOnCode ? input.dependsOnCode.toUpperCase() : null }),
        ...(input.formulaDescription !== undefined && { formulaDescription: input.formulaDescription }),
      },
    });

    await AuditService.log({
      userId,
      action: "SALARY_RULE_UPDATED",
      entityType: "SalaryRule",
      entityId: id,
      oldData: existing,
      newData: updated,
      reason: "Updated salary rule",
    });

    return updated;
  }

  /**
   * Delete (soft-delete) a salary rule.
   */
  static async deleteRule(id: string, userId?: string) {
    const existing = await db.salaryRule.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Salary rule not found", 404, "NOT_FOUND");
    }

    await db.salaryRule.update({
      where: { id },
      data: { isActive: false },
    });

    await AuditService.log({
      userId,
      action: "SALARY_RULE_DELETED",
      entityType: "SalaryRule",
      entityId: id,
      reason: `Deactivated salary rule ${existing.code}`,
    });

    return { message: "Salary rule deleted successfully" };
  }
}

export default SalaryService;
