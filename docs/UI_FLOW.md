# PeoplePay360 — UI Flow & Frontend Contract

**Version:** 1.0  
**Purpose:** Shared frontend navigation, screen ownership, UI behavior and integration flow.

## 1. UX Goal

PeoplePay360 should feel like one connected operational application, not a set of unrelated CRUD pages.

The primary story is:

```text
Employee Setup
    ↓
Daily HR Activity
    ↓
Payroll Preparation
    ↓
Validation
    ↓
Finalization
    ↓
Explainable Payslip
```

## 2. Global Layout

```text
┌─────────────────────────────────────────────────────┐
│ Topbar: Logo | Current User | Notifications | Menu │
├─────────────┬───────────────────────────────────────┤
│ Sidebar     │                                       │
│             │             Page Content              │
│ Dashboard   │                                       │
│ Employees   │                                       │
│ Contracts   │                                       │
│ Schedules   │                                       │
│ Attendance  │                                       │
│ Time Off    │                                       │
│ Payroll     │                                       │
│ Payslips    │                                       │
│ Audit       │                                       │
│ Settings    │                                       │
└─────────────┴───────────────────────────────────────┘
```

Navigation items are permission-aware, but backend authorization remains authoritative.

## 3. Shared Design System

Both frontend members must use the same:

- typography
- colors
- spacing
- borders/radius
- button variants
- inputs
- tables
- cards
- status badges
- dialogs
- page headers
- empty/loading/error states

Shared UI components belong under:

```text
frontend/src/components/ui/
```

Feature components belong under domain folders.

## 4. Frontend Page Map

```text
/login
/dashboard
/employees
/employees/:id
/contracts
/schedules
/attendance
/time-off
/salary-structures
/salary-structures/:id
/payruns
/payruns/new
/payruns/:id
/payruns/:id/validation
/payslips/:id
/audit-logs
/employee-portal
```

## 5. Login Flow

```text
Login
  ↓
POST /api/auth/login
  ↓
Store authenticated session/token
  ↓
Load current user/role
  ↓
Redirect to role-appropriate dashboard
```

Show useful error messages for invalid credentials and authorization failures.

## 6. Dashboard

Purpose: answer **“What needs attention now?”**

Recommended sections:

```text
Employees
Current Payrun
Pending Leave
Attendance Exceptions
Payroll Warnings
Critical Issues
Recent Payruns
```

Critical issues should be visually more prominent than ordinary metrics.

## 7. Employee List

### List View

Show:

- Employee ID
- Name
- Department
- Designation
- Status
- Actions

Actions:

```text
View
Edit
Archive
```

### Kanban View

Group by status:

```text
ACTIVE
INACTIVE
ARCHIVED
```

### Search/Filter

- Search by name/employee code
- Department
- Status

Frontend consumes `GET /api/employees`.

## 8. Employee Form

Fields:

- Employee ID
- Name
- Email
- Phone
- Joining date
- Department
- Designation
- Status

Flow:

```text
Open Form
  ↓
Client Validation
  ↓
POST/PATCH /api/employees
  ↓
Success Toast
  ↓
Return to Employee Details/List
```

## 9. Employee Details

Recommended tabs:

```text
Overview
Contracts
Schedule
Attendance
Time Off
Payslips
Audit
```

The page should make Employee the central hub of the system.

## 10. Contract Screen

Show historical contracts as cards/timeline:

```text
Jan 1 — Mar 15     ₹40,000
        ↓
Mar 16 — Dec 31    ₹50,000
```

Each contract should display:

- start/end date
- wage
- salary structure
- working schedule
- status

Never calculate contract applicability in React. Use the backend applicable-contract API.

## 11. Working Schedule Screen

Show:

- schedule name
- working days
- start time
- end time
- break
- calculated net hours/day
- expected hours for selected period

## 12. Attendance Screen

### Table

```text
Date | Check In | Check Out | Worked Hours | Status | Exception
```

Actions:

- Check in
- Check out
- Correct attendance (authorized users)
- Review exception

Exception colors:

```text
Normal → neutral
Warning → orange
Critical → red
```

## 13. Time Off Screen

Tabs:

```text
Types
Allocations
Requests
My Balance
```

Employee request flow:

```text
Request Leave
  ↓
Select Type
  ↓
Select Dates
  ↓
Enter Reason
  ↓
Submit
  ↓
Status = Submitted
```

Manager flow:

```text
Pending Request
  ↓
View Details
  ↓
Approve / Reject
  ↓
Request Status Updated
```

## 14. Salary Structure Screen

Show salary structures and their ordered rules.

Example:

```text
Regular Monthly

10  BASIC
20  HRA
30  GROSS
40  PF
50  UNPAID_LEAVE
60  NET
```

Rule editor should show:

- code
- name
- category
- sequence
- calculation type
- value
- dependency
- formula description

## 15. Payrun Wizard

The primary payroll flow is a wizard.

```text
STEP 1 — Period
       ↓
STEP 2 — Employees
       ↓
STEP 3 — Review
       ↓
Create Payrun
       ↓
Compute
       ↓
Validate
       ↓
Finalize
```

### Step 1 — Period

Fields:

- period start
- period end

### Step 2 — Employees

Show eligible employees.

Allow authorized payroll users to select employees.

### Step 3 — Review

Show:

- employee count
- selected period
- expected payroll status

## 16. Payrun Details

Show:

```text
Period
Status
Employee Count
Gross Total
Deductions Total
Net Total
```

Primary actions depend on state:

```text
DRAFT → Compute
IN_PROGRESS → Validate
VALIDATED → Finalize
FINALIZED → View Payslips
```

## 17. Payroll Validation Cockpit ⭐

This is the main PeoplePay360 demo screen.

Layout:

```text
PAYRUN — SEPTEMBER 2026

Status: BLOCKED

CRITICAL — 2
┌────────────────────────────────────────┐
│ ❌ EMP102 — No active contract         │
│    [View Employee] [Fix]               │
└────────────────────────────────────────┘

WARNINGS — 3
┌────────────────────────────────────────┐
│ ⚠ EMP115 — Attendance exception       │
│    [Review]                            │
└────────────────────────────────────────┘

[Revalidate]
[Finalize Payrun]
```

Rules:

- Red = blocker.
- Orange = warning.
- Finalize button must be disabled/blocked when critical errors exist.
- Clicking an issue should navigate directly to the relevant record.

## 18. Explainable Payslip ⭐

Main structure:

```text
EMPLOYEE
PAYROLL PERIOD

EARNINGS
Basic             ₹30,000
HRA                ₹6,000
Overtime            ₹2,400

DEDUCTIONS
PF                 ₹3,600
Unpaid Leave       ₹1,000

NET PAY            ₹33,800
```

For each line, allow “Why?” / details:

```text
Rule: HRA
Input: Basic = ₹30,000
Formula: Basic × 20%
Result: ₹6,000
```

The frontend only displays backend-provided calculation explanations.

## 19. Payslip PDF

Actions:

```text
View PDF
Download PDF
Print
```

PDF content:

- Company information
- Employee information
- Payroll period
- Earnings
- Deductions
- Gross
- Net

## 20. Audit Log Screen

Columns:

```text
Time
User
Action
Entity
Record
Reason
```

Expandable details:

```text
Old Value
→
New Value
```

## 21. Employee Self-Service

Minimal employee navigation:

```text
My Profile
My Attendance
My Leave
My Payslips
```

Employees can only access their own records.

## 22. UI State Rules

Every server-driven screen should handle:

```text
Loading
Success
Empty
Error
Unauthorized
```

Do not show blank pages while API calls are running.

## 23. API Integration Rule

Frontend must never hard-code business results such as:

```text
Net salary
Leave balance
Applicable contract
Validation status
Expected payroll totals
```

Frontend requests the backend result and renders it.

## 24. Shared Component Contract

Recommended shared components:

```text
Button
Input
Select
DatePicker
Card
Table
Modal
Tabs
StatusBadge
Alert
Toast
PageHeader
StatCard
EmptyState
LoadingState
ConfirmDialog
```

Domain components:

```text
ContractTimeline
AttendanceExceptionCard
LeaveApprovalCard
PayrunSummary
ValidationIssueCard
PayslipLine
SalaryRuleRow
```

## 25. Frontend Ownership

### Frontend Member 1 — HR Workspace

Owns:

```text
Employees
Contracts
Schedules
Attendance
Time Off
HR dashboard sections
```

### Frontend Member 2 — Payroll Workspace

Owns:

```text
Salary Structures
Salary Rules
Payrun Wizard
Payrun Details
Validation Cockpit
Payslips
Audit UI
Employee Portal
Payroll dashboard sections
```

Both must use the shared design system.

## 26. Demo Flow

The final demo should follow one continuous story:

```text
1. Open employee with multiple historical contracts
2. Show current applicable contract
3. Create September payrun
4. Compute payroll
5. Validation finds a critical issue
6. Attempt finalization → blocked
7. Fix issue
8. Revalidate → critical = 0
9. Open payslip
10. Explain a salary line using formula + inputs
11. Finalize payrun
12. Generate/download PDF
13. Switch to Employee view
14. Employee sees their payslip
```

## 27. Frontend Non-Goals

Do not build separate frontend systems for:

- Recruitment
- Performance management
- Training
- AI chatbot
- Advanced payroll forecasting
- Complex mobile app

The UI should prioritize the core employee-to-payroll flow.
