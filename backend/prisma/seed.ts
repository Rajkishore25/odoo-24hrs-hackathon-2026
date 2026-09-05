import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PeoplePay360 database...");

  // 1. Clean existing records if any
  await prisma.auditLog.deleteMany({});
  await prisma.payslipLine.deleteMany({});
  await prisma.payslip.deleteMany({});
  await prisma.payrun.deleteMany({});
  await prisma.timeOffRequest.deleteMany({});
  await prisma.timeOffAllocation.deleteMany({});
  await prisma.timeOffType.deleteMany({});
  await prisma.attendanceException.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.salaryRule.deleteMany({});
  await prisma.salaryStructure.deleteMany({});
  await prisma.workingSchedule.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash("password123", 10);

  // 2. Create Users for all 5 roles
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@peoplepay360.com",
      passwordHash: defaultPassword,
      role: "SUPER_ADMIN",
    },
  });

  const hrUser = await prisma.user.create({
    data: {
      email: "hr@peoplepay360.com",
      passwordHash: defaultPassword,
      role: "HR_MANAGER",
    },
  });

  const payrollUser = await prisma.user.create({
    data: {
      email: "payroll@peoplepay360.com",
      passwordHash: defaultPassword,
      role: "PAYROLL_OFFICER",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@peoplepay360.com",
      passwordHash: defaultPassword,
      role: "LINE_MANAGER",
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: "rahul@peoplepay360.com",
      passwordHash: defaultPassword,
      role: "EMPLOYEE",
    },
  });

  console.log("✅ Users created");

  // 3. Create Working Schedule
  const standardSchedule = await prisma.workingSchedule.create({
    data: {
      name: "Standard 9 to 6 (Mon-Fri)",
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: 60,
      workingDays: ["MON", "TUE", "WED", "THU", "FRI"],
    },
  });

  console.log("✅ Working schedule created");

  // 4. Create Salary Structure & Rules
  const salaryStructure = await prisma.salaryStructure.create({
    data: {
      name: "Standard Corporate Structure",
      description: "Standard monthly payroll structure with basic, allowances and deductions",
    },
  });

  await prisma.salaryRule.createMany({
    data: [
      {
        salaryStructureId: salaryStructure.id,
        name: "Basic Salary",
        code: "BASIC",
        category: "EARNING",
        sequence: 10,
        calculationType: "FIXED",
        value: 40000,
        formulaDescription: "Fixed monthly base wage",
      },
      {
        salaryStructureId: salaryStructure.id,
        name: "House Rent Allowance",
        code: "HRA",
        category: "EARNING",
        sequence: 20,
        calculationType: "PERCENTAGE",
        value: 20,
        dependsOnCode: "BASIC",
        formulaDescription: "20% of Basic Salary",
      },
      {
        salaryStructureId: salaryStructure.id,
        name: "Provident Fund",
        code: "PF",
        category: "DEDUCTION",
        sequence: 30,
        calculationType: "PERCENTAGE",
        value: 12,
        dependsOnCode: "BASIC",
        formulaDescription: "12% deduction on Basic Salary",
      },
    ],
  });

  console.log("✅ Salary structure & rules created");

  // 5. Create Employees
  // Employee 1: Rahul (Linked to user, has valid contract)
  const empRahul = await prisma.employee.create({
    data: {
      userId: employeeUser.id,
      employeeCode: "EMP001",
      name: "Rahul Kumar",
      email: "rahul@peoplepay360.com",
      phone: "+91 9876543210",
      department: "Engineering",
      designation: "Senior Software Engineer",
      joiningDate: new Date("2025-01-10"),
      status: "ACTIVE",
      bankAccountNumber: "HDFC000123456789",
      bankName: "HDFC Bank",
    },
  });

  // Employee 2: Priya (Demo scenario: No contract, triggers CRITICAL validation in payrun!)
  const empPriya = await prisma.employee.create({
    data: {
      employeeCode: "EMP002",
      name: "Priya Sharma",
      email: "priya@peoplepay360.com",
      phone: "+91 9876543211",
      department: "Product Design",
      designation: "UI/UX Designer",
      joiningDate: new Date("2025-06-01"),
      status: "ACTIVE",
      bankAccountNumber: "ICIC000987654321",
      bankName: "ICICI Bank",
    },
  });

  // Employee 3: Amit (Demo scenario: Has contract, but unusual overtime warning)
  const empAmit = await prisma.employee.create({
    data: {
      employeeCode: "EMP003",
      name: "Amit Verma",
      email: "amit@peoplepay360.com",
      phone: "+91 9876543212",
      department: "DevOps",
      designation: "DevOps Engineer",
      joiningDate: new Date("2024-11-15"),
      status: "ACTIVE",
      bankAccountNumber: "SBIN000555666777",
      bankName: "State Bank of India",
    },
  });

  console.log("✅ Employees created (Rahul, Priya, Amit)");

  // 6. Create Contracts
  await prisma.contract.create({
    data: {
      employeeId: empRahul.id,
      startDate: new Date("2025-01-10"),
      endDate: null, // Open-ended active contract
      wage: 50000,
      salaryStructureId: salaryStructure.id,
      workingScheduleId: standardSchedule.id,
      status: "ACTIVE",
    },
  });

  await prisma.contract.create({
    data: {
      employeeId: empAmit.id,
      startDate: new Date("2024-11-15"),
      endDate: null,
      wage: 65000,
      salaryStructureId: salaryStructure.id,
      workingScheduleId: standardSchedule.id,
      status: "ACTIVE",
    },
  });

  console.log("✅ Contracts created (Rahul & Amit have active contracts; Priya intentionally has none for demo)");

  // 7. Create Time Off Types & Allocations
  const annualLeave = await prisma.timeOffType.create({
    data: {
      name: "Paid Annual Leave",
      isPaid: true,
      unit: "DAYS",
    },
  });

  const sickLeave = await prisma.timeOffType.create({
    data: {
      name: "Sick Leave",
      isPaid: true,
      unit: "DAYS",
    },
  });

  await prisma.timeOffAllocation.createMany({
    data: [
      {
        employeeId: empRahul.id,
        timeOffTypeId: annualLeave.id,
        allocatedDays: 18,
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
      {
        employeeId: empRahul.id,
        timeOffTypeId: sickLeave.id,
        allocatedDays: 10,
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
      {
        employeeId: empAmit.id,
        timeOffTypeId: annualLeave.id,
        allocatedDays: 18,
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
      },
    ],
  });

  // Approved leave for Rahul
  await prisma.timeOffRequest.create({
    data: {
      employeeId: empRahul.id,
      timeOffTypeId: annualLeave.id,
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-02-11"),
      requestedDays: 2,
      reason: "Family event",
      status: "APPROVED",
      approverId: managerUser.id,
      approvedAt: new Date("2026-02-08"),
    },
  });

  console.log("✅ Time off types, allocations, and requests created");

  // 8. Create Attendance & Exceptions
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  await prisma.attendance.create({
    data: {
      employeeId: empRahul.id,
      date: new Date(dateStr),
      checkIn: new Date(`${dateStr}T09:05:00Z`),
      checkOut: new Date(`${dateStr}T18:02:00Z`),
      workedHours: 8.95,
      status: "PRESENT",
      hasException: false,
    },
  });

  const amitAttendance = await prisma.attendance.create({
    data: {
      employeeId: empAmit.id,
      date: new Date(dateStr),
      checkIn: new Date(`${dateStr}T08:00:00Z`),
      checkOut: new Date(`${dateStr}T22:30:00Z`),
      workedHours: 14.5,
      status: "PRESENT",
      hasException: true,
    },
  });

  await prisma.attendanceException.create({
    data: {
      employeeId: empAmit.id,
      attendanceId: amitAttendance.id,
      type: "UNUSUAL_HOURS",
      status: "OPEN",
      reason: "Excessive shift duration of 14.5 hours",
    },
  });

  console.log("✅ Attendance & Exception records created");
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
