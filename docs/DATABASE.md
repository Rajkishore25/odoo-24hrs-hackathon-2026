# PeoplePay360 — Database Contract

**Database:** PostgreSQL  
**ORM:** Prisma  
**Version:** 1.0

This document is the shared relational model for the entire team.

## 1. Design Principles

- PostgreSQL is the source of truth.
- Use UUIDs for public/API identifiers.
- Use foreign keys for relationships.
- Use database constraints wherever possible.
- Store money as `DECIMAL/NUMERIC`, never floating-point.
- Store dates as `DATE` and event timestamps as `TIMESTAMP WITH TIME ZONE`.
- Do not duplicate calculated payroll totals in unrelated tables unless they are a deliberate snapshot.
- Payroll finalization must be transactional.

## 2. Entity Overview

```text
User
 └── Employee (optional one-to-one link for employee users)

Employee
 ├── Contract (1:N)
 ├── Attendance (1:N)
 ├── AttendanceException (1:N)
 ├── TimeOffAllocation (1:N)
 ├── TimeOffRequest (1:N)
 └── Payslip (1:N)

Contract
 ├── SalaryStructure (N:1)
 └── WorkingSchedule (N:1)

SalaryStructure
 └── SalaryRule (1:N)

Payrun
 └── Payslip (1:N)
        └── PayslipLine (1:N)

User
 └── AuditLog (1:N)
```

## 3. User

Purpose: authentication and authorization.

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR | UNIQUE, NOT NULL |
| passwordHash | VARCHAR | NOT NULL |
| role | ENUM | NOT NULL |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |
| isActive | BOOLEAN | NOT NULL, default true |

Roles:

```text
SUPER_ADMIN
HR_MANAGER
PAYROLL_OFFICER
LINE_MANAGER
EMPLOYEE
```

## 4. Employee

Purpose: central employee record.

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| userId | UUID | UNIQUE, nullable, FK User |
| employeeCode | VARCHAR | UNIQUE, NOT NULL |
| name | VARCHAR | NOT NULL |
| email | VARCHAR | NOT NULL |
| phone | VARCHAR | nullable |
| department | VARCHAR | nullable |
| designation | VARCHAR | nullable |
| joiningDate | DATE | NOT NULL |
| status | ENUM | NOT NULL |
| bankAccountNumber | VARCHAR | nullable, sensitive |
| bankName | VARCHAR | nullable |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

Employee statuses:

```text
ACTIVE
INACTIVE
ARCHIVED
```

## 5. WorkingSchedule

Purpose: define expected working time.

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| startTime | TIME | NOT NULL |
| endTime | TIME | NOT NULL |
| breakMinutes | INTEGER | NOT NULL, default 0 |
| workingDays | JSONB | NOT NULL |
| isActive | BOOLEAN | NOT NULL, default true |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

`workingDays` stores an array such as:

```json
["MON", "TUE", "WED", "THU", "FRI"]
```

## 6. SalaryStructure

Purpose: reusable salary calculation template.

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| description | TEXT | nullable |
| isActive | BOOLEAN | NOT NULL, default true |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

## 7. SalaryRule

Purpose: an ordered salary calculation rule.

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| salaryStructureId | UUID | FK SalaryStructure, NOT NULL |
| name | VARCHAR | NOT NULL |
| code | VARCHAR | NOT NULL |
| category | ENUM | NOT NULL |
| sequence | INTEGER | NOT NULL |
| calculationType | ENUM | NOT NULL |
| value | NUMERIC(14,2) | nullable |
| dependsOnCode | VARCHAR | nullable |
| formulaDescription | TEXT | nullable |
| isActive | BOOLEAN | NOT NULL, default true |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

Unique constraint:

```text
UNIQUE(salaryStructureId, code)
```

Rule categories:

```text
EARNING
DEDUCTION
NET
```

Calculation types:

```text
FIXED
PERCENTAGE
REFERENCE
```

## 8. Contract

Purpose: employment terms for a defined period.

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| employeeId | UUID | FK Employee, NOT NULL |
| startDate | DATE | NOT NULL |
| endDate | DATE | nullable |
| wage | NUMERIC(14,2) | NOT NULL |
| salaryStructureId | UUID | FK SalaryStructure, NOT NULL |
| workingScheduleId | UUID | FK WorkingSchedule, NOT NULL |
| status | ENUM | NOT NULL |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

Contract statuses:

```text
DRAFT
ACTIVE
EXPIRED
CANCELLED
```

Rules:

- `endDate` may be null for an open-ended contract.
- `endDate >= startDate` when end date exists.
- Overlapping active contracts for the same employee must be rejected unless the product explicitly supports overlap with a separate business rule.
- Payroll must use applicable contract(s) for the selected period.

## 9. Attendance

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| employeeId | UUID | FK Employee, NOT NULL |
| date | DATE | NOT NULL |
| checkIn | TIMESTAMPTZ | nullable |
| checkOut | TIMESTAMPTZ | nullable |
| workedHours | NUMERIC(6,2) | NOT NULL, default 0 |
| status | ENUM | NOT NULL |
| hasException | BOOLEAN | NOT NULL, default false |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

Attendance statuses:

```text
PRESENT
ABSENT
LATE
EARLY_DEPARTURE
MISSING_PUNCH
```

Recommended unique constraint:

```text
UNIQUE(employeeId, date)
```

## 10. AttendanceException

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| employeeId | UUID | FK Employee, NOT NULL |
| attendanceId | UUID | FK Attendance, NOT NULL |
| type | ENUM | NOT NULL |
| status | ENUM | NOT NULL |
| reason | TEXT | nullable |
| reviewedBy | UUID | FK User, nullable |
| reviewedAt | TIMESTAMPTZ | nullable |
| createdAt | TIMESTAMPTZ | NOT NULL |

Exception types:

```text
MISSING_PUNCH
UNUSUAL_HOURS
INVALID_PUNCH
OTHER
```

Exception statuses:

```text
OPEN
REVIEWED
CORRECTED
DISMISSED
```

## 11. TimeOffType

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | UNIQUE, NOT NULL |
| isPaid | BOOLEAN | NOT NULL |
| unit | ENUM | NOT NULL, default DAYS |
| isActive | BOOLEAN | NOT NULL, default true |

## 12. TimeOffAllocation

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| employeeId | UUID | FK Employee, NOT NULL |
| timeOffTypeId | UUID | FK TimeOffType, NOT NULL |
| allocatedDays | NUMERIC(8,2) | NOT NULL |
| validFrom | DATE | NOT NULL |
| validTo | DATE | NOT NULL |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

## 13. TimeOffRequest

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| employeeId | UUID | FK Employee, NOT NULL |
| timeOffTypeId | UUID | FK TimeOffType, NOT NULL |
| startDate | DATE | NOT NULL |
| endDate | DATE | NOT NULL |
| requestedDays | NUMERIC(8,2) | NOT NULL |
| reason | TEXT | nullable |
| status | ENUM | NOT NULL |
| approverId | UUID | FK User, nullable |
| approvedAt | TIMESTAMPTZ | nullable |
| rejectionReason | TEXT | nullable |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

Statuses:

```text
DRAFT
SUBMITTED
APPROVED
REJECTED
```

## 14. Payrun

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| periodStart | DATE | NOT NULL |
| periodEnd | DATE | NOT NULL |
| status | ENUM | NOT NULL |
| totalGross | NUMERIC(16,2) | NOT NULL, default 0 |
| totalDeductions | NUMERIC(16,2) | NOT NULL, default 0 |
| totalNet | NUMERIC(16,2) | NOT NULL, default 0 |
| createdBy | UUID | FK User, NOT NULL |
| finalizedAt | TIMESTAMPTZ | nullable |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

Payrun statuses:

```text
DRAFT
IN_PROGRESS
VALIDATED
FINALIZED
PAID
```

Rules:

- `periodStart <= periodEnd`.
- Do not allow duplicate payroll processing for the same employee and period.
- Finalization must be transactional.

## 15. Payslip

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| payrunId | UUID | FK Payrun, NOT NULL |
| employeeId | UUID | FK Employee, NOT NULL |
| status | ENUM | NOT NULL |
| gross | NUMERIC(14,2) | NOT NULL |
| totalDeductions | NUMERIC(14,2) | NOT NULL |
| net | NUMERIC(14,2) | NOT NULL |
| pdfPath | TEXT | nullable |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |

Payslip statuses:

```text
DRAFT
COMPUTED
VALIDATED
PAID
```

Recommended unique constraint:

```text
UNIQUE(payrunId, employeeId)
```

## 16. PayslipLine

Purpose: preserve the explanation/snapshot of each calculation result.

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| payslipId | UUID | FK Payslip, NOT NULL |
| ruleId | UUID | FK SalaryRule, nullable |
| code | VARCHAR | NOT NULL |
| name | VARCHAR | NOT NULL |
| category | ENUM | NOT NULL |
| sequence | INTEGER | NOT NULL |
| inputValues | JSONB | NOT NULL |
| formulaDescription | TEXT | nullable |
| amount | NUMERIC(14,2) | NOT NULL |

The line is a payroll snapshot. It should remain stable after finalization.

## 17. AuditLog

Fields:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK User, NOT NULL |
| action | VARCHAR | NOT NULL |
| entityType | VARCHAR | NOT NULL |
| entityId | UUID | nullable |
| oldData | JSONB | nullable |
| newData | JSONB | nullable |
| reason | TEXT | nullable |
| createdAt | TIMESTAMPTZ | NOT NULL |

Critical actions to log:

- Contract create/update/cancel
- Salary structure/rule changes
- Leave approvals/rejections
- Attendance corrections
- Payrun state changes
- Payslip adjustments
- Role changes

## 18. Relationship Summary

```text
User 1 ─── 0..1 Employee
User 1 ─── N AuditLog

Employee 1 ─── N Contract
Employee 1 ─── N Attendance
Employee 1 ─── N AttendanceException
Employee 1 ─── N TimeOffAllocation
Employee 1 ─── N TimeOffRequest
Employee 1 ─── N Payslip

Contract N ─── 1 SalaryStructure
Contract N ─── 1 WorkingSchedule

SalaryStructure 1 ─── N SalaryRule

Payrun 1 ─── N Payslip
Payslip 1 ─── N PayslipLine
PayslipLine N ─── 0..1 SalaryRule
```

## 19. Important Database Constraints

The backend/database should enforce at least:

1. Unique employee code.
2. Unique user email.
3. Unique time-off type name.
4. Unique salary-rule code within a salary structure.
5. Unique attendance per employee per date.
6. Unique payslip per employee per payrun.
7. Valid date ranges.
8. Foreign-key integrity.
9. Non-negative allocation days and salary amounts where applicable.
10. Transactional payrun finalization.

## 20. Payroll Transaction Boundary

Compute/finalize operations that update multiple related rows should use a database transaction.

Example:

```text
Start Transaction
    ↓
Validate payrun
    ↓
Update payrun status
    ↓
Freeze payslips/payslip lines
    ↓
Record audit entry
    ↓
Commit
```

If any critical operation fails, rollback.
