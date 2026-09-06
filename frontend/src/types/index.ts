// ─── Shared API response wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Users & Auth ─────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'HR_MANAGER' | 'PAYROLL_OFFICER' | 'LINE_MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

// ─── Employees ────────────────────────────────────────────────────────────────
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  joiningDate: string;
  status: EmployeeStatus;
  bankAccountNumber?: string;
  bankName?: string;
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Contract {
  id: string;
  employeeId: string;
  startDate: string;
  endDate?: string | null;
  wage: number;
  salaryStructureId: string;
  workingScheduleId: string;
  status: ContractStatus;
  salaryStructure?: SalaryStructure;
  workingSchedule?: WorkingSchedule;
}

// ─── Working Schedules ────────────────────────────────────────────────────────
export interface WorkingSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workingDays: string[];
  isActive: boolean;
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_DEPARTURE' | 'MISSING_PUNCH';
export type ExceptionStatus = 'OPEN' | 'REVIEWED' | 'CORRECTED' | 'DISMISSED';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workedHours: number;
  status: AttendanceStatus;
  hasException: boolean;
  employee?: Pick<Employee, 'id' | 'name' | 'employeeCode'>;
}

export interface AttendanceException {
  id: string;
  employeeId: string;
  attendanceId: string;
  type: string;
  status: ExceptionStatus;
  reason?: string;
  reviewedAt?: string;
}

// ─── Time Off ─────────────────────────────────────────────────────────────────
export type TimeOffRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface TimeOffType {
  id: string;
  name: string;
  isPaid: boolean;
  unit: 'DAYS' | 'HOURS';
}

export interface TimeOffAllocation {
  id: string;
  employeeId: string;
  timeOffTypeId: string;
  allocatedDays: number;
  validFrom: string;
  validTo: string;
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reason?: string;
  status: TimeOffRequestStatus;
  approverId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  employee?: Pick<Employee, 'id' | 'name' | 'employeeCode'>;
  timeOffType?: TimeOffType;
}

// ─── Salary ───────────────────────────────────────────────────────────────────
export type SalaryRuleCategory = 'EARNING' | 'DEDUCTION' | 'NET';
export type SalaryCalculationType = 'FIXED' | 'PERCENTAGE' | 'REFERENCE';

export interface SalaryStructure {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  rules?: SalaryRule[];
}

export interface SalaryRule {
  id: string;
  salaryStructureId: string;
  name: string;
  code: string;
  category: SalaryRuleCategory;
  sequence: number;
  calculationType: SalaryCalculationType;
  value?: number | null;
  dependsOnCode?: string | null;
  formulaDescription?: string;
  isActive: boolean;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────
export type PayrunStatus = 'DRAFT' | 'IN_PROGRESS' | 'VALIDATED' | 'FINALIZED' | 'PAID';
export type PayslipStatus = 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID';

export interface Payrun {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: PayrunStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  createdById: string;
  finalizedAt?: string | null;
  createdAt: string;
}

export interface PayslipLine {
  id: string;
  payslipId: string;
  ruleId?: string | null;
  code: string;
  name: string;
  category: SalaryRuleCategory;
  sequence: number;
  inputValues: Record<string, number>;
  formulaDescription?: string | null;
  amount: number;
}

export interface Payslip {
  id: string;
  payrunId: string;
  employeeId: string;
  status: PayslipStatus;
  gross: number;
  totalDeductions: number;
  net: number;
  pdfPath?: string | null;
  lines: PayslipLine[];
  employee?: Employee;
  payrun?: Payrun;
}

// ─── Validation ───────────────────────────────────────────────────────────────
export type ValidationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  message: string;
  suggestedAction: string;
}

export interface ValidationResult {
  status: 'CLEAR' | 'WARNINGS_ONLY' | 'BLOCKED';
  canFinalize: boolean;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  employeesChecked: number;
  issues: ValidationIssue[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    employeesChecked: number;
  };
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  reason?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'email' | 'role'>;
}
