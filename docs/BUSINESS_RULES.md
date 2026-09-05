# PeoplePay360 — Business Rules

**Version:** 1.0  
**Purpose:** Single source of truth for payroll and HR business behavior.

## 1. Core Principle

PeoplePay360 is a connected HR-to-payroll system.

The payroll result must be derived from the employee context for the selected period:

```text
Employee
  ↓
Applicable Contract
  ↓
Working Schedule
  ↓
Attendance
  ↓
Approved Time Off
  ↓
Salary Structure + Ordered Rules
  ↓
Payroll Calculation
  ↓
Validation
  ↓
Payrun
  ↓
Payslip
```

Payroll calculation belongs to the backend. The frontend never independently calculates or overrides the authoritative salary result.

# 2. Employee Rules

- Employee code must be unique.
- An archived employee cannot be newly added to future payroll scope unless explicitly reactivated.
- Employee data required for payroll must pass validation before finalization.
- Employee bank details are sensitive and must only be accessible to authorized roles.

# 3. Contract Rules

## 3.1 Valid Contract

A contract overlaps a payroll period when:

```text
contract.startDate <= payroll.periodEnd
AND
(
    contract.endDate IS NULL
    OR
    contract.endDate >= payroll.periodStart
)
```

## 3.2 Contract Selection

For each employee included in a payrun:

1. Find contracts overlapping the payroll period.
2. Ignore cancelled contracts.
3. If no applicable contract exists, create a **CRITICAL** validation error.
4. If exactly one contract applies to the entire period, use it.
5. If different contracts apply to different parts of the period, split the period and prorate the wage by applicable days.

## 3.3 Mid-Period Contract Change

Example:

```text
Contract A: Jan 1 – Mar 15 → ₹40,000/month
Contract B: Mar 16 – Dec 31 → ₹50,000/month
```

March payroll must use the applicable days from both contracts.

The exact proration denominator must be defined consistently by the implementation; for the hackathon, use the configured payroll-period day basis and document it in the calculation result.

## 3.4 Invalid Contract Dates

- End date before start date → reject.
- Overlapping active contracts for the same employee → reject unless an explicit overlap policy exists.

# 4. Working Schedule Rules

A schedule defines:

- working days
- start time
- end time
- break duration

## 4.1 Expected Hours

```text
Expected Hours = Sum of scheduled net hours within payroll period
```

Exclude non-working days defined by the schedule.

For a schedule of 8 net hours/day and 22 working days:

```text
22 × 8 = 176 expected hours
```

## 4.2 Schedule Change Mid-Period

If the employee changes schedule during a payroll period, calculate expected hours separately for each schedule segment.

# 5. Attendance Rules

## 5.1 Worked Hours

For a valid check-in/check-out pair:

```text
Raw Hours = CheckOut - CheckIn
Net Worked Hours = Raw Hours - Configured Break
```

Do not allow negative worked hours.

## 5.2 Attendance Statuses

```text
PRESENT
ABSENT
LATE
EARLY_DEPARTURE
MISSING_PUNCH
```

## 5.3 Missing Punch

Missing check-in or check-out should create an attendance exception.

## 5.4 Exception Review

Exception states:

```text
OPEN → REVIEWED → CORRECTED
                    ↘ DISMISSED
```

Unresolved exceptions should appear in payroll validation as warnings unless the business later configures them as blockers.

# 6. Time Off Rules

## 6.1 Request States

```text
DRAFT
↓
SUBMITTED
↓
APPROVED / REJECTED
```

## 6.2 Leave Balance

Baseline balance formula:

```text
Balance = Allocation + Accruals - Approved Leave
```

For the hackathon MVP, accruals may be zero unless explicitly implemented.

## 6.3 Approval

Only authorized approvers may approve/reject a request.

Approval should:

1. Change request status to `APPROVED`.
2. Record approver and timestamp.
3. Affect the calculated balance.
4. Make the leave available to payroll processing.

## 6.4 Unpaid Leave

Approved unpaid leave becomes a payroll input and creates a salary deduction according to the configured salary rule.

## 6.5 Cross-Period Leave

If a leave request crosses payroll periods, only the days that fall inside the current payrun period are considered for that payrun.

# 7. Salary Structure Rules

Salary rules execute in ascending sequence order.

Recommended baseline:

```text
10 BASIC
20 HRA
30 GROSS
40 PF
50 UNPAID_LEAVE
60 NET
```

Later rules may reference earlier rule results.

Example:

```text
HRA = BASIC × 20%
PF  = BASIC × 12%
```

## 7.1 Fixed Rule

```text
Result = configured fixed value
```

## 7.2 Percentage Rule

```text
Result = referenced base × configured percentage / 100
```

## 7.3 Reference Rule

```text
Result = referenced rule result
```

## 7.4 Rule Validation

Reject or flag:

- duplicate rule code in the same structure
- invalid sequence
- missing dependency
- circular dependency
- unsupported calculation type

# 8. Payroll Calculation Rules

For each employee in the payrun:

```text
1. Resolve contract(s)
2. Resolve schedule(s)
3. Calculate expected hours/days
4. Load attendance
5. Load approved leave
6. Execute salary rules in sequence
7. Generate payslip lines
8. Calculate gross
9. Calculate deductions
10. Calculate net
11. Run validations
```

## 8.1 Gross

```text
Gross = Sum of earning lines
```

## 8.2 Total Deductions

```text
Total Deductions = Sum of deduction lines
```

## 8.3 Net

```text
Net = Gross - Total Deductions
```

## 8.4 Negative Net

If:

```text
Net < 0
```

create a **CRITICAL** validation error and block finalization.

# 9. Payrun Rules

## 9.1 Payrun States

```text
DRAFT
↓
IN_PROGRESS
↓
VALIDATED
↓
FINALIZED
↓
PAID
```

## 9.2 Payrun Creation

When a payrun is created:

- Period must be valid.
- Employee scope must be explicit or deterministically generated.
- Do not create a second conflicting run for the same employee and period.

## 9.3 Compute

Compute creates or updates draft payslips.

The operation is idempotent for the same payrun: re-running compute should update the current draft calculation rather than create duplicate payslips.

## 9.4 Validation

Validation must produce two categories:

```text
CRITICAL
WARNING
```

### Critical examples

```text
❌ No active/applicable contract
❌ Missing salary structure
❌ Missing required payroll data
❌ Duplicate payroll conflict
❌ Negative net salary
```

### Warning examples

```text
⚠ Unresolved attendance exception
⚠ High overtime
⚠ Unapproved leave that has not yet affected payroll
⚠ Significant salary change
```

Critical errors block finalization.

Warnings do not automatically block finalization unless the configured rule says they should.

# 10. Finalization Rules

A payrun may be finalized only when:

```text
status is computable
AND
critical error count = 0
```

Finalization should:

1. Lock the payrun from normal editing.
2. Freeze payslip/payslip-line calculation results.
3. Record finalization timestamp.
4. Create an audit log entry.
5. Generate payslip PDF files.

# 11. Post-Finalization Changes

Direct edits to finalized payslips are not allowed.

For the MVP, any correction after finalization should require a controlled correction/recalculation process rather than silently mutating the finalized record.

# 12. Explainable Payslip Rules

Each payslip line should store:

- salary rule code
- rule name
- sequence
- input values
- formula description
- resulting amount

Example:

```text
HRA
Input: BASIC = ₹30,000
Formula: BASIC × 20%
Result: ₹6,000
```

The explanation must reflect the actual calculation that produced the line.

# 13. Audit Rules

Audit critical actions:

```text
Contract changes
Salary structure/rule changes
Attendance corrections
Leave approvals/rejections
Payrun state changes
Payslip adjustments
Role changes
```

Audit data should include:

```text
Who
When
What changed
Old value
New value
Reason (when supplied)
```

# 14. Role Rules

## Super Admin

- Full system access.
- Manage users and roles.
- Configure system.
- View audit logs.

## HR Manager

- Employee CRUD.
- Contract management.
- Working schedules.
- Leave configuration and allocation.
- Salary structure configuration.
- View relevant payroll information.

## Payroll Officer

- Create payruns.
- Compute payroll.
- Validate payruns.
- Resolve payroll data issues within permission scope.
- Finalize payruns according to the configured permission model.
- View and generate payslips.

## Line Manager

- View team leave requests.
- Approve/reject team leave.
- Review team attendance exceptions.
- No access to salary configuration.

## Employee

- View own profile/attendance.
- Submit leave requests.
- View own leave balance.
- View/download own payslips.

## Important Security Rule

Backend authorization is mandatory. Hiding a frontend button is not authorization.

# 15. Validation Examples for Demo

## Example A — Missing Contract

```text
Employee: EMP102
Payroll Period: September 2026
No applicable contract found
→ CRITICAL
→ PAYRUN BLOCKED
```

## Example B — Attendance Exception

```text
Employee: EMP115
Missing checkout on 2026-09-12
→ WARNING
→ Review required
```

## Example C — High Overtime

```text
Employee: EMP118
Overtime: 52 hours
Configured threshold: 50 hours
→ WARNING
```

## Example D — Valid Payrun

```text
Critical errors: 0
Warnings: 1
→ Payrun can be finalized
```

# 16. MVP Calculation Example

```text
Basic Salary = ₹50,000
HRA = 50% of Basic = ₹25,000
DA = 20% of Basic = ₹10,000

Gross = ₹85,000

PF = 12% of Basic = ₹6,000
Professional Tax = ₹200

Total Deductions = ₹6,200

Net = ₹78,800
```

The actual configured salary rules, not hard-coded frontend arithmetic, determine the final result.

# 17. Non-Goals for the 24-Hour MVP

Do not make these dependencies for the core demo:

- Machine-learning payroll prediction
- AI-generated salary calculation
- Full multi-country payroll legislation
- Biometric device integration
- Full HR suite such as recruitment/performance/training
- Complex payroll forecasting
- Full what-if simulation

# 18. Golden Rule

```text
Never sacrifice correctness of the employee → payroll flow
for additional features.
```
