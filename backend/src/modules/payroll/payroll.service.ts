import prisma from '../../config/prisma';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import { auditLog } from '../audit/audit.service';
import { computeEmployeePayroll } from './payroll.engine';
import { validatePayrun } from './payroll.validation';
import { generatePayslipPdf } from '../payslips/payslip.pdf';
import { CreatePayrunInput } from './payroll.schema';

// ── Payruns ───────────────────────────────────────────────────────────────────

export async function listPayruns(query: Record<string, string>) {
  const { page, limit, skip } = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.payrun.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, email: true } },
        _count: { select: { payslips: true } },
      },
    }),
    prisma.payrun.count(),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}

export async function getPayrun(id: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, email: true } },
      payslips: {
        include: {
          employee: { select: { id: true, name: true, employeeCode: true, department: true } },
          lines: { orderBy: { sequence: 'asc' } },
        },
      },
    },
  });
  if (!payrun) throw new NotFoundError('Payrun');
  return payrun;
}

export async function createPayrun(input: CreatePayrunInput, actorId: string) {
  const periodStart = new Date(input.periodStart);
  const periodEnd = new Date(input.periodEnd);

  if (periodEnd < periodStart) {
    throw new ValidationError('Period end date cannot be before period start date');
  }

  // Check for duplicate in-progress/finalized payruns for overlapping employees
  const conflicting = await prisma.payslip.findFirst({
    where: {
      employeeId: { in: input.employeeIds },
      payrun: {
        periodStart: { lte: periodEnd },
        periodEnd: { gte: periodStart },
        status: { in: ['FINALIZED', 'PAID'] },
      },
    },
  });
  if (conflicting) {
    throw new ConflictError(
      'One or more employees already have a finalized payrun for an overlapping period'
    );
  }

  const name =
    input.name ??
    `Payrun ${periodStart.toLocaleString('default', { month: 'long' })} ${periodStart.getFullYear()}`;

  const payrun = await prisma.payrun.create({
    data: {
      name,
      periodStart,
      periodEnd,
      status: 'DRAFT',
      createdById: actorId,
      payslips: {
        create: input.employeeIds.map((employeeId) => ({
          employeeId,
          status: 'DRAFT',
          gross: 0,
          totalDeductions: 0,
          net: 0,
        })),
      },
    },
    include: {
      _count: { select: { payslips: true } },
    },
  });

  await auditLog({
    userId: actorId,
    action: 'PAYRUN_CREATED',
    entityType: 'Payrun',
    entityId: payrun.id,
    newData: { name: payrun.name, periodStart, periodEnd, employeeCount: input.employeeIds.length },
  });

  return payrun;
}

export async function computePayrun(payrunId: string, actorId: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: { payslips: { select: { id: true, employeeId: true } } },
  });
  if (!payrun) throw new NotFoundError('Payrun');

  if (payrun.status === 'FINALIZED' || payrun.status === 'PAID') {
    throw new ValidationError('Cannot recompute a finalized or paid payrun');
  }

  const periodStart = payrun.periodStart;
  const periodEnd = payrun.periodEnd;

  // Compute in parallel, then persist in a transaction
  const computations = await Promise.all(
    payrun.payslips.map((ps) =>
      computeEmployeePayroll(ps.employeeId, periodStart, periodEnd)
    )
  );

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  await prisma.$transaction(async (tx) => {
    for (const payslip of payrun.payslips) {
      const computation = computations.find((c) => c.employeeId === payslip.employeeId);
      if (!computation) continue;

      // Delete old lines before inserting new ones (idempotent compute)
      await tx.payslipLine.deleteMany({ where: { payslipId: payslip.id } });

      await tx.payslip.update({
        where: { id: payslip.id },
        data: {
          status: 'COMPUTED',
          gross: computation.gross,
          totalDeductions: computation.totalDeductions,
          net: computation.net,
          lines: {
            create: computation.lines.map((line) => ({
              ruleId: line.ruleId,
              code: line.code,
              name: line.name,
              category: line.category,
              sequence: line.sequence,
              inputValues: line.inputValues,
              formulaDescription: line.formulaDescription,
              amount: line.amount,
            })),
          },
        },
      });

      totalGross += computation.gross;
      totalDeductions += computation.totalDeductions;
      totalNet += computation.net;
    }

    await tx.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'IN_PROGRESS',
        totalGross,
        totalDeductions,
        totalNet,
      },
    });
  });

  await auditLog({
    userId: actorId,
    action: 'PAYRUN_COMPUTED',
    entityType: 'Payrun',
    entityId: payrunId,
    newData: { totalGross, totalDeductions, totalNet },
  });

  return prisma.payrun.findUnique({
    where: { id: payrunId },
    include: { _count: { select: { payslips: true } } },
  });
}

export async function validatePayrunRoute(payrunId: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
  if (!payrun) throw new NotFoundError('Payrun');
  if (payrun.status === 'DRAFT') {
    throw new ValidationError('Payrun must be computed before validation. Run compute first.');
  }

  const result = await validatePayrun(payrunId);

  // Update payrun status to VALIDATED only if there are no critical issues
  if (result.criticalCount === 0) {
    await prisma.payrun.update({
      where: { id: payrunId },
      data: { status: 'VALIDATED' },
    });
  }

  return result;
}

export async function finalizePayrun(payrunId: string, actorId: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: { payslips: true },
  });
  if (!payrun) throw new NotFoundError('Payrun');

  if (payrun.status === 'FINALIZED' || payrun.status === 'PAID') {
    throw new ConflictError('Payrun is already finalized');
  }
  if (payrun.status === 'DRAFT') {
    throw new ValidationError('Payrun must be computed and validated before finalization');
  }

  // ── The critical business rule: re-validate before finalizing ─────────────
  const validationResult = await validatePayrun(payrunId);
  if (!validationResult.canFinalize) {
    throw new ValidationError(
      `Payrun cannot be finalized. ${validationResult.criticalCount} critical issue(s) must be resolved.`,
      {
        criticalIssues: validationResult.issues.filter((i) => i.severity === 'CRITICAL'),
        criticalCount: validationResult.criticalCount,
      }
    );
  }

  // ── Finalize in a transaction ─────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    await tx.payrun.update({
      where: { id: payrunId },
      data: { status: 'FINALIZED', finalizedAt: new Date() },
    });

    await tx.payslip.updateMany({
      where: { payrunId },
      data: { status: 'PAID' },
    });
  });

  // Generate PDFs asynchronously (don't block the response)
  generatePdfsForPayrun(payrunId).catch((err) =>
    console.error('[PDF Generation Error]', err)
  );

  await auditLog({
    userId: actorId,
    action: 'PAYRUN_FINALIZED',
    entityType: 'Payrun',
    entityId: payrunId,
    newData: { status: 'FINALIZED', finalizedAt: new Date() },
  });

  return prisma.payrun.findUnique({ where: { id: payrunId } });
}

export async function getPayrunPayslips(payrunId: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
  if (!payrun) throw new NotFoundError('Payrun');

  return prisma.payslip.findMany({
    where: { payrunId },
    include: {
      employee: { select: { id: true, name: true, employeeCode: true, department: true } },
      lines: { orderBy: { sequence: 'asc' } },
    },
  });
}

async function generatePdfsForPayrun(payrunId: string) {
  const payslips = await prisma.payslip.findMany({
    where: { payrunId },
    include: {
      employee: true,
      payrun: true,
      lines: { orderBy: { sequence: 'asc' } },
    },
  });

  for (const payslip of payslips) {
    try {
      const pdfPath = await generatePayslipPdf(payslip);
      await prisma.payslip.update({
        where: { id: payslip.id },
        data: { pdfPath },
      });
    } catch (err) {
      console.error(`[PDF] Failed for payslip ${payslip.id}:`, err);
    }
  }
}

export async function deletePayrun(payrunId: string, actorId: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
  if (!payrun) throw new NotFoundError('Payrun');

  // Cannot delete a finalized/paid payrun — those are permanent records
  if (payrun.status === 'FINALIZED' || payrun.status === 'PAID') {
    throw new ValidationError(
      'Finalized or paid payruns cannot be deleted. They are permanent payroll records.'
    );
  }

  // Delete in a transaction: lines → payslips → payrun
  await prisma.$transaction(async (tx) => {
    // Delete all payslip lines first
    await tx.payslipLine.deleteMany({
      where: { payslip: { payrunId } },
    });
    // Delete all payslips
    await tx.payslip.deleteMany({ where: { payrunId } });
    // Delete the payrun
    await tx.payrun.delete({ where: { id: payrunId } });
  });

  await auditLog({
    userId: actorId,
    action: 'PAYRUN_DELETED',
    entityType: 'Payrun',
    entityId: payrunId,
    oldData: { name: payrun.name, status: payrun.status },
  });

  return { deleted: true, id: payrunId };
}
