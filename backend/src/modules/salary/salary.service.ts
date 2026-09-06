import prisma from '../../config/prisma';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { auditLog } from '../audit/audit.service';
import { CreateRuleInput } from './salary.schema';

// ── Structures ────────────────────────────────────────────────────────────────

export async function listStructures() {
  return prisma.salaryStructure.findMany({
    where: { isActive: true },
    include: { rules: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
    orderBy: { name: 'asc' },
  });
}

export async function getStructure(id: string) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id },
    include: { rules: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
  });
  if (!structure) throw new NotFoundError('Salary Structure');
  return structure;
}

export async function createStructure(data: { name: string; description?: string }, actorId: string) {
  const structure = await prisma.salaryStructure.create({ data });

  await auditLog({
    userId: actorId,
    action: 'SALARY_STRUCTURE_CREATED',
    entityType: 'SalaryStructure',
    entityId: structure.id,
    newData: structure,
  });

  return structure;
}

export async function updateStructure(id: string, data: { name?: string; description?: string }, actorId: string) {
  const existing = await prisma.salaryStructure.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Salary Structure');

  const updated = await prisma.salaryStructure.update({ where: { id }, data });

  await auditLog({
    userId: actorId,
    action: 'SALARY_STRUCTURE_UPDATED',
    entityType: 'SalaryStructure',
    entityId: id,
    oldData: existing,
    newData: updated,
  });

  return updated;
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export async function listRules(structureId: string) {
  return prisma.salaryRule.findMany({
    where: { salaryStructureId: structureId, isActive: true },
    orderBy: { sequence: 'asc' },
  });
}

export async function createRule(input: CreateRuleInput, actorId: string) {
  // Validate no duplicate code in structure
  const existing = await prisma.salaryRule.findFirst({
    where: {
      salaryStructureId: input.structureId,
      code: input.code.toUpperCase(),
      isActive: true,
    },
  });
  if (existing) {
    throw new ConflictError(`Rule code "${input.code}" already exists in this structure`);
  }

  // Validate dependency exists
  if (input.dependsOnCode && input.calculationType !== 'REFERENCE') {
    const dep = await prisma.salaryRule.findFirst({
      where: {
        salaryStructureId: input.structureId,
        code: input.dependsOnCode.toUpperCase(),
      },
    });
    if (!dep) {
      throw new ValidationError(`Dependency rule code "${input.dependsOnCode}" does not exist in this structure`);
    }
    if (dep.sequence >= input.sequence) {
      throw new ValidationError(`Dependency rule "${input.dependsOnCode}" must have a lower sequence number than the current rule`);
    }
  }

  const rule = await prisma.salaryRule.create({
    data: {
      salaryStructureId: input.structureId,
      name: input.name,
      code: input.code.toUpperCase(),
      category: input.category,
      sequence: input.sequence,
      calculationType: input.calculationType,
      value: input.value ?? null,
      dependsOnCode: input.dependsOnCode?.toUpperCase() ?? null,
      formulaDescription: input.formulaDescription,
    },
  });

  await auditLog({
    userId: actorId,
    action: 'SALARY_RULE_CREATED',
    entityType: 'SalaryRule',
    entityId: rule.id,
    newData: rule,
  });

  return rule;
}

export async function updateRule(id: string, input: Partial<CreateRuleInput>, actorId: string) {
  const existing = await prisma.salaryRule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Salary Rule');

  const updated = await prisma.salaryRule.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.category && { category: input.category }),
      ...(input.sequence !== undefined && { sequence: input.sequence }),
      ...(input.calculationType && { calculationType: input.calculationType }),
      ...(input.value !== undefined && { value: input.value }),
      ...(input.dependsOnCode !== undefined && { dependsOnCode: input.dependsOnCode?.toUpperCase() ?? null }),
      ...(input.formulaDescription !== undefined && { formulaDescription: input.formulaDescription }),
    },
  });

  await auditLog({
    userId: actorId,
    action: 'SALARY_RULE_UPDATED',
    entityType: 'SalaryRule',
    entityId: id,
    oldData: existing,
    newData: updated,
  });

  return updated;
}
