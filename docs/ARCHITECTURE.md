# PeoplePay360 — System Architecture

**Version:** 1.0

## 1. Overview

PeoplePay360 uses a **modular monolithic** client-server architecture:

1. React frontend (Vite + TypeScript + Tailwind + shadcn/ui)
2. Node.js + Express backend (TypeScript)
3. PostgreSQL database
4. Prisma ORM
5. JWT authentication + RBAC
6. Deterministic payroll engine
7. Validation engine
8. PDF generation (PDFKit)
9. Audit logging

---

## 2. Monorepo Structure

```
peoplepay360/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── contracts/
│   │   │   ├── schedules/
│   │   │   ├── attendance/
│   │   │   ├── timeoff/
│   │   │   ├── salary/
│   │   │   ├── payroll/
│   │   │   ├── payslips/
│   │   │   ├── dashboard/
│   │   │   └── audit/
│   │   ├── utils/
│   │   └── app.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── ui/       ← shared design system
│   │   │   ├── layout/
│   │   │   └── [domain]/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
└── docs/
```

---

## 3. Request Flow

```
HTTP Request
     ↓
Route
     ↓
Auth Middleware (JWT verify)
     ↓
Role Middleware (RBAC)
     ↓
Zod Validation
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL
```

---

## 4. Payroll Architecture

```
Payrun
  ↓
Payroll Service
  ↓
 [Employee + Contract + Schedule + Attendance + Leave + SalaryRules]
  ↓
Payroll Engine (deterministic)
  ↓
Payslip + PayslipLines
  ↓
Validation Engine
  ↓
CRITICAL? → BLOCK finalize
NO CRITICAL? → ALLOW finalize
```

---

## 5. Principles

1. **Backend is source of truth** — payroll never calculated in React.
2. **Business logic in services** — not routes or components.
3. **Deterministic payroll** — same inputs + rules = same result.
4. **Validation before finalization** — critical errors block finalize at the API level.
5. **Audit everything sensitive** — contract changes, payroll state changes, leave approvals.
6. **Keep it simple** — monolith, no Kafka/microservices/Redis.
