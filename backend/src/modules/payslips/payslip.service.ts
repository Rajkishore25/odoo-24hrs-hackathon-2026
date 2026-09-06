import prisma from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { generatePayslipPdf } from './payslip.pdf';

export async function getPayslip(id: string, requesterId: string, requesterRole: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: {
      employee: true,
      payrun: true,
      lines: { orderBy: { sequence: 'asc' } },
    },
  });

  if (!payslip) throw new NotFoundError('Payslip');

  // Employees can only view their own payslips
  if (requesterRole === 'EMPLOYEE') {
    const employee = await prisma.employee.findFirst({
      where: { userId: requesterId },
    });
    if (!employee || employee.id !== payslip.employeeId) {
      throw new ForbiddenError('You can only view your own payslips');
    }
  }

  return payslip;
}

export async function listPayslipsForEmployee(employeeId: string, requesterId: string, requesterRole: string) {
  // Employees can only see their own
  if (requesterRole === 'EMPLOYEE') {
    const employee = await prisma.employee.findFirst({ where: { userId: requesterId } });
    if (!employee || employee.id !== employeeId) {
      throw new ForbiddenError('You can only view your own payslips');
    }
  }

  return prisma.payslip.findMany({
    where: { employeeId },
    include: { payrun: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPayslipPdf(id: string, requesterId: string, requesterRole: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { employee: true, payrun: true, lines: { orderBy: { sequence: 'asc' } } },
  });

  if (!payslip) throw new NotFoundError('Payslip');

  if (requesterRole === 'EMPLOYEE') {
    const employee = await prisma.employee.findFirst({ where: { userId: requesterId } });
    if (!employee || employee.id !== payslip.employeeId) {
      throw new ForbiddenError('You can only download your own payslips');
    }
  }

  // Generate on demand if PDF not yet created
  if (!payslip.pdfPath) {
    const pdfPath = await generatePayslipPdf(payslip);
    await prisma.payslip.update({ where: { id }, data: { pdfPath } });
    return pdfPath;
  }

  return payslip.pdfPath;
}


export async function updatePayslip(
  id: string,
  data: { gross?: number; totalDeductions?: number; net?: number; note?: string },
  requesterId: string,
  requesterRole: string
) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { payrun: true },
  });
  if (!payslip) throw new NotFoundError('Payslip');

  // Only SUPER_ADMIN, HR_MANAGER, PAYROLL_OFFICER can edit
  if (!['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'].includes(requesterRole)) {
    throw new ForbiddenError('You do not have permission to edit payslips');
  }

  // Cannot edit finalized/paid payslips
  if (payslip.payrun.status === 'FINALIZED' || payslip.payrun.status === 'PAID') {
    throw new ForbiddenError('Finalized payslips cannot be edited. They are permanent records.');
  }

  const updated = await prisma.payslip.update({
    where: { id },
    data: {
      ...(data.gross !== undefined && { gross: data.gross }),
      ...(data.totalDeductions !== undefined && { totalDeductions: data.totalDeductions }),
      ...(data.net !== undefined && { net: data.net }),
    },
    include: { employee: true, payrun: true, lines: { orderBy: { sequence: 'asc' } } },
  });

  // Recalculate payrun totals
  const allPayslips = await prisma.payslip.findMany({ where: { payrunId: payslip.payrunId } });
  const totalGross = allPayslips.reduce((s, p) => s + Number(p.gross), 0);
  const totalDeductions = allPayslips.reduce((s, p) => s + Number(p.totalDeductions), 0);
  const totalNet = allPayslips.reduce((s, p) => s + Number(p.net), 0);

  await prisma.payrun.update({
    where: { id: payslip.payrunId },
    data: { totalGross, totalDeductions, totalNet },
  });

  return updated;
}

export async function deletePayslip(id: string, requesterId: string, requesterRole: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { payrun: true, employee: true },
  });
  if (!payslip) throw new NotFoundError('Payslip');

  if (!['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'].includes(requesterRole)) {
    throw new ForbiddenError('You do not have permission to delete payslips');
  }

  if (payslip.payrun.status === 'FINALIZED' || payslip.payrun.status === 'PAID') {
    throw new ForbiddenError('Finalized payslips cannot be deleted. They are permanent records.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.payslipLine.deleteMany({ where: { payslipId: id } });
    await tx.payslip.delete({ where: { id } });
  });

  // Recalculate payrun totals after deletion
  const remaining = await prisma.payslip.findMany({ where: { payrunId: payslip.payrunId } });
  await prisma.payrun.update({
    where: { id: payslip.payrunId },
    data: {
      totalGross: remaining.reduce((s, p) => s + Number(p.gross), 0),
      totalDeductions: remaining.reduce((s, p) => s + Number(p.totalDeductions), 0),
      totalNet: remaining.reduce((s, p) => s + Number(p.net), 0),
    },
  });

  return { deleted: true, id, employeeName: payslip.employee.name };
}
