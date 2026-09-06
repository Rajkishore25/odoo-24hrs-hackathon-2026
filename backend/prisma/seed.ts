import { PrismaClient, UserRole, EmployeeStatus, ContractStatus, SalaryRuleCategory, SalaryCalculationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PeoplePay360 database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@peoplepay360.com' },
    update: {},
    create: { email: 'admin@peoplepay360.com', passwordHash, role: UserRole.SUPER_ADMIN },
  });

  const hrManager = await prisma.user.upsert({
    where: { email: 'hr@peoplepay360.com' },
    update: {},
    create: { email: 'hr@peoplepay360.com', passwordHash, role: UserRole.HR_MANAGER },
  });

  const payrollOfficer = await prisma.user.upsert({
    where: { email: 'payroll@peoplepay360.com' },
    update: {},
    create: { email: 'payroll@peoplepay360.com', passwordHash, role: UserRole.PAYROLL_OFFICER },
  });

  const lineManager = await prisma.user.upsert({
    where: { email: 'manager@peoplepay360.com' },
    update: {},
    create: { email: 'manager@peoplepay360.com', passwordHash, role: UserRole.LINE_MANAGER },
  });

  const emp1User = await prisma.user.upsert({
    where: { email: 'rahul@peoplepay360.com' },
    update: {},
    create: { email: 'rahul@peoplepay360.com', passwordHash, role: UserRole.EMPLOYEE },
  });

  const emp2User = await prisma.user.upsert({
    where: { email: 'priya@peoplepay360.com' },
    update: {},
    create: { email: 'priya@peoplepay360.com', passwordHash, role: UserRole.EMPLOYEE },
  });

  // Employee with NO contract — for demo validation scenario
  const emp3User = await prisma.user.upsert({
    where: { email: 'arjun@peoplepay360.com' },
    update: {},
    create: { email: 'arjun@peoplepay360.com', passwordHash, role: UserRole.EMPLOYEE },
  });

  console.log('✅ Users seeded');

  // ── Working Schedule ───────────────────────────────────────────────────────
  const schedule = await prisma.workingSchedule.upsert({
    where: { id: 'sched-standard-001' },
    update: {},
    create: {
      id: 'sched-standard-001',
      name: 'Standard 9 to 6',
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    },
  });

  console.log('✅ Working schedule seeded');

  // ── Salary Structure ───────────────────────────────────────────────────────
  const structure = await prisma.salaryStructure.upsert({
    where: { id: 'struct-regular-001' },
    update: {},
    create: {
      id: 'struct-regular-001',
      name: 'Regular Monthly',
      description: 'Standard monthly salary with HRA, DA, PF deductions',
    },
  });

  // ── Salary Rules ───────────────────────────────────────────────────────────
  const rulesData = [
    {
      id: 'rule-basic-001',
      code: 'BASIC',
      name: 'Basic Salary',
      category: SalaryRuleCategory.EARNING,
      sequence: 10,
      calculationType: SalaryCalculationType.REFERENCE,
      value: null,
      dependsOnCode: null,
      formulaDescription: 'Contract wage',
    },
    {
      id: 'rule-hra-001',
      code: 'HRA',
      name: 'House Rent Allowance',
      category: SalaryRuleCategory.EARNING,
      sequence: 20,
      calculationType: SalaryCalculationType.PERCENTAGE,
      value: 20,
      dependsOnCode: 'BASIC',
      formulaDescription: 'BASIC × 20%',
    },
    {
      id: 'rule-da-001',
      code: 'DA',
      name: 'Dearness Allowance',
      category: SalaryRuleCategory.EARNING,
      sequence: 30,
      calculationType: SalaryCalculationType.PERCENTAGE,
      value: 10,
      dependsOnCode: 'BASIC',
      formulaDescription: 'BASIC × 10%',
    },
    {
      id: 'rule-gross-001',
      code: 'GROSS',
      name: 'Gross Salary',
      category: SalaryRuleCategory.EARNING,
      sequence: 40,
      calculationType: SalaryCalculationType.REFERENCE,
      value: null,
      dependsOnCode: null,
      formulaDescription: 'BASIC + HRA + DA',
    },
    {
      id: 'rule-pf-001',
      code: 'PF',
      name: 'Provident Fund',
      category: SalaryRuleCategory.DEDUCTION,
      sequence: 50,
      calculationType: SalaryCalculationType.PERCENTAGE,
      value: 12,
      dependsOnCode: 'BASIC',
      formulaDescription: 'BASIC × 12%',
    },
    {
      id: 'rule-pt-001',
      code: 'PT',
      name: 'Professional Tax',
      category: SalaryRuleCategory.DEDUCTION,
      sequence: 60,
      calculationType: SalaryCalculationType.FIXED,
      value: 200,
      dependsOnCode: null,
      formulaDescription: 'Fixed ₹200/month',
    },
    {
      id: 'rule-net-001',
      code: 'NET',
      name: 'Net Salary',
      category: SalaryRuleCategory.NET,
      sequence: 100,
      calculationType: SalaryCalculationType.REFERENCE,
      value: null,
      dependsOnCode: null,
      formulaDescription: 'GROSS - Total Deductions',
    },
  ];

  for (const rule of rulesData) {
    await prisma.salaryRule.upsert({
      where: { id: rule.id },
      update: {},
      create: { ...rule, salaryStructureId: structure.id },
    });
  }

  console.log('✅ Salary structure and rules seeded');

  // ── Employees ──────────────────────────────────────────────────────────────
  const emp1 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP001' },
    update: {},
    create: {
      userId: emp1User.id,
      employeeCode: 'EMP001',
      name: 'Rahul Kumar',
      email: 'rahul@peoplepay360.com',
      phone: '+919876543210',
      department: 'Engineering',
      designation: 'Software Developer',
      joiningDate: new Date('2025-01-10'),
      status: EmployeeStatus.ACTIVE,
      bankAccountNumber: '1234567890',
      bankName: 'State Bank of India',
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP002' },
    update: {},
    create: {
      userId: emp2User.id,
      employeeCode: 'EMP002',
      name: 'Priya Sharma',
      email: 'priya@peoplepay360.com',
      phone: '+919876543211',
      department: 'Operations',
      designation: 'HR Specialist',
      joiningDate: new Date('2025-03-01'),
      status: EmployeeStatus.ACTIVE,
      bankAccountNumber: '0987654321',
      bankName: 'HDFC Bank',
    },
  });

  // Employee with NO contract — triggers critical validation error in demo
  const emp3 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP003' },
    update: {},
    create: {
      userId: emp3User.id,
      employeeCode: 'EMP003',
      name: 'Arjun Mehta',
      email: 'arjun@peoplepay360.com',
      phone: '+919876543212',
      department: 'Finance',
      designation: 'Accountant',
      joiningDate: new Date('2025-06-01'),
      status: EmployeeStatus.ACTIVE,
      // No bank details — triggers critical validation warning too
    },
  });

  console.log('✅ Employees seeded');

  // ── Contracts ──────────────────────────────────────────────────────────────
  await prisma.contract.upsert({
    where: { id: 'contract-emp1-001' },
    update: {},
    create: {
      id: 'contract-emp1-001',
      employeeId: emp1.id,
      startDate: new Date('2025-01-10'),
      endDate: new Date('2026-03-15'),
      wage: 40000,
      salaryStructureId: structure.id,
      workingScheduleId: schedule.id,
      status: ContractStatus.EXPIRED,
    },
  });

  await prisma.contract.upsert({
    where: { id: 'contract-emp1-002' },
    update: {},
    create: {
      id: 'contract-emp1-002',
      employeeId: emp1.id,
      startDate: new Date('2026-03-16'),
      endDate: null, // open-ended
      wage: 50000,
      salaryStructureId: structure.id,
      workingScheduleId: schedule.id,
      status: ContractStatus.ACTIVE,
    },
  });

  await prisma.contract.upsert({
    where: { id: 'contract-emp2-001' },
    update: {},
    create: {
      id: 'contract-emp2-001',
      employeeId: emp2.id,
      startDate: new Date('2025-03-01'),
      endDate: null,
      wage: 45000,
      salaryStructureId: structure.id,
      workingScheduleId: schedule.id,
      status: ContractStatus.ACTIVE,
    },
  });

  // EMP003 intentionally has NO contract for demo validation scenario

  console.log('✅ Contracts seeded');

  // ── Leave Types ────────────────────────────────────────────────────────────
  const annualLeave = await prisma.timeOffType.upsert({
    where: { name: 'Annual Leave' },
    update: {},
    create: { name: 'Annual Leave', isPaid: true, unit: 'DAYS' },
  });

  const sickLeave = await prisma.timeOffType.upsert({
    where: { name: 'Sick Leave' },
    update: {},
    create: { name: 'Sick Leave', isPaid: true, unit: 'DAYS' },
  });

  await prisma.timeOffType.upsert({
    where: { name: 'Unpaid Leave' },
    update: {},
    create: { name: 'Unpaid Leave', isPaid: false, unit: 'DAYS' },
  });

  console.log('✅ Leave types seeded');

  // ── Leave Allocations ──────────────────────────────────────────────────────
  await prisma.timeOffAllocation.upsert({
    where: { id: 'alloc-emp1-annual' },
    update: {},
    create: {
      id: 'alloc-emp1-annual',
      employeeId: emp1.id,
      timeOffTypeId: annualLeave.id,
      allocatedDays: 20,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
    },
  });

  await prisma.timeOffAllocation.upsert({
    where: { id: 'alloc-emp1-sick' },
    update: {},
    create: {
      id: 'alloc-emp1-sick',
      employeeId: emp1.id,
      timeOffTypeId: sickLeave.id,
      allocatedDays: 10,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
    },
  });

  await prisma.timeOffAllocation.upsert({
    where: { id: 'alloc-emp2-annual' },
    update: {},
    create: {
      id: 'alloc-emp2-annual',
      employeeId: emp2.id,
      timeOffTypeId: annualLeave.id,
      allocatedDays: 20,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
    },
  });

  console.log('✅ Leave allocations seeded');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo accounts:');
  console.log('  Super Admin:     admin@peoplepay360.com    / Password123!');
  console.log('  HR Manager:      hr@peoplepay360.com       / Password123!');
  console.log('  Payroll Officer: payroll@peoplepay360.com  / Password123!');
  console.log('  Line Manager:    manager@peoplepay360.com  / Password123!');
  console.log('  Employee 1:      rahul@peoplepay360.com    / Password123!');
  console.log('  Employee 2:      priya@peoplepay360.com    / Password123!');
  console.log('  Employee 3:      arjun@peoplepay360.com    / Password123! (no contract — demo critical error)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
