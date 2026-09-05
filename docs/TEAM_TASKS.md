# PeoplePay360 — Team Task Breakdown

## Member 1 — Frontend HR Workspace
- Employee management UI (list, create, profile, edit)
- Contract management UI (contract history, new contract form, date ranges)
- Working Schedule UI
- Attendance tracking UI (check in/out modal, exception indicator)
- Time Off / Leave UI (leave balance cards, request form, manager approval list)

## Member 2 — Frontend Payroll & Employee Portal
- Authentication UI (login page, role-based navigation)
- Executive Dashboard (KPI cards, payrun statuses)
- Salary Structure & Rule builder UI
- Payrun creation & computation cockpit
- Payroll Validation Cockpit (Critical/Warning issues, block finalization banner)
- Explainable Payslip viewer & PDF download trigger
- Employee Self-Service portal

## Member 3 — Backend HR (Current: Branch `aakif`)
- Database Schema (`backend/prisma/schema.prisma`) & migrations
- Employee domain (service, controller, routes, validations)
- Contract intelligence (validation, overlap checking, applicable contract resolution)
- Working schedule (expected hours calculation)
- Attendance domain (check in/out, exception detection, exception resolution)
- Time Off / Leave domain (allocations, requests, real-time balance computation, approvals)
- Audit log tracking for HR operations

## Member 4 — Backend Auth + Payroll Engine
- Authentication & JWT token issuance / bcrypt hashing
- RBAC authorization middleware
- Salary structures & rules engine
- Payroll computation engine (deterministic basic + allowances - deductions = net)
- Validation engine (CRITICAL / WARNING / INFO issue generator)
- Payrun finalization transaction & hard blocking
- Payslip line snapshot generation
- Payslip PDF generation (PDFKit)
