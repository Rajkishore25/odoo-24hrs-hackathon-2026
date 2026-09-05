# PeoplePay360 — Team Documentation

PeoplePay360 is a connected HR and Payroll platform for a 24-hour, 4-member hackathon.

## Documentation

- [API Contract](docs/API.md) — frontend/backend API agreement
- [Database Contract](docs/DATABASE.md) — PostgreSQL data model and constraints
- [Business Rules](docs/BUSINESS-RULES.md) — payroll and HR logic
- [UI Flow](docs/UI-FLOW.md) — frontend navigation, workflows and shared UI rules

## Core Workflow

```text
Employee
  ↓
Contract
  ↓
Working Schedule
  ↓
Attendance + Time Off
  ↓
Salary Structure + Rules
  ↓
Payrun
  ↓
Validation
  ↓
Payslip
  ↓
PDF / Employee Portal
```

## Team Structure

- Frontend Member 1 — HR Workspace
- Frontend Member 2 — Payroll Workspace
- Backend Member 1 — HR Services + PostgreSQL/Prisma
- Backend Member 2 — Authentication/RBAC + Payroll Engine

## Working Rule

Do not build the whole project in one task. Work from the task board one small feature at a time and keep the API/database/business-rule documents synchronized.
