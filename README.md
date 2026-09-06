# PeoplePay360

> Connected HR-to-payroll platform that validates workforce data before payroll, prevents critical errors from being finalized, and explains every payslip amount.

**Hackathon MVP — 24 hours · 4 members**

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Backend

```bash
cd backend

# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed

# Start development server
npm run dev
```

Backend runs at **http://localhost:5000**

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at **http://localhost:5173**

The Vite dev server proxies `/api` → `http://localhost:5000` automatically.

---

## Demo Accounts

All passwords: `Password123!`

| Role             | Email                         |
|------------------|-------------------------------|
| Super Admin      | admin@peoplepay360.com        |
| HR Manager       | hr@peoplepay360.com           |
| Payroll Officer  | payroll@peoplepay360.com      |
| Line Manager     | manager@peoplepay360.com      |
| Employee 1       | rahul@peoplepay360.com        |
| Employee 2       | priya@peoplepay360.com        |
| Employee 3 (⚠ no contract) | arjun@peoplepay360.com |

> EMP003 (Arjun) has **no contract** — intentionally set up to trigger a CRITICAL validation error in the demo payrun.

---

## Demo Flow

Follow this sequence for the full demo story:

```
1.  Login as Payroll Officer
2.  Dashboard → see pending issues
3.  HR Manager → create payrun for September 2026
4.  Select all 3 employees → Create
5.  Compute payroll
6.  Validate → Cockpit shows:
      ❌ CRITICAL — Arjun has no contract
      ⚠  WARNING  — attendance exceptions
7.  Try to Finalize → BLOCKED (API enforces, not just UI)
8.  Switch to HR Manager → open Arjun → add contract
9.  Back to Payrun → Revalidate
      ❌ CRITICAL: 0
10. Finalize payrun
11. Open Rahul's payslip → expand each line to see formula
12. Download PDF
13. Switch to Employee (rahul@) → My Portal → view payslip
```

---

## Architecture

```
peoplepay360/
├── backend/                    Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma       Full database schema (15 models)
│   │   └── seed.ts             Demo data
│   └── src/
│       ├── config/             env, prisma client
│       ├── middleware/         auth (JWT), rbac, validate (Zod), errorHandler
│       ├── modules/
│       │   ├── auth/           Login, JWT
│       │   ├── employees/      CRUD
│       │   ├── contracts/      CRUD + overlap detection + period resolution
│       │   ├── schedules/      Working schedules + expected hours
│       │   ├── attendance/     Check-in/out + exception management
│       │   ├── timeoff/        Types, allocations, requests, balance
│       │   ├── salary/         Structures + rules
│       │   ├── payroll/        Engine + validation + payruns
│       │   ├── payslips/       Payslip service + PDF generation
│       │   ├── dashboard/      Aggregated KPIs
│       │   └── audit/          Audit log service + routes
│       └── utils/              response, errors, pagination, dateHelpers
│
├── frontend/                   React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── api/                Axios API modules (1 per domain)
│       ├── components/
│       │   ├── layout/         AppLayout, Sidebar, Topbar (theme toggle)
│       │   └── ui/             shadcn base components + custom
│       ├── context/            ThemeContext (light/dark), AuthContext (JWT)
│       ├── pages/
│       │   ├── auth/           LoginPage
│       │   ├── dashboard/      DashboardPage
│       │   ├── employees/      EmployeesPage, EmployeeDetailPage
│       │   ├── contracts/      ContractsPage
│       │   ├── schedules/      SchedulesPage
│       │   ├── attendance/     AttendancePage
│       │   ├── timeoff/        TimeOffPage
│       │   ├── salary/         SalaryPage
│       │   ├── payroll/        PayrunsPage, PayrunDetailPage, ValidationCockpitPage ⭐
│       │   ├── payslips/       PayslipDetailPage ⭐ (explainable)
│       │   ├── audit/          AuditLogsPage
│       │   └── portal/         EmployeePortalPage
│       ├── router/             AppRouter + ProtectedRoute (RBAC)
│       ├── styles/             globals.css (light/dark CSS variables, no gradients)
│       └── types/              Shared TypeScript types
│
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── API.md
    ├── DATABASE.md
    ├── BUSINESS-RULES.md
    ├── UI-FLOW.md
    ├── TEAM-TASKS.md
    └── CONTRIBUTING.md
```

---

## Core Differentiators

### 1. Payroll Validation Cockpit
After computing payroll, the system runs validation rules and displays:
- **CRITICAL** errors that block finalization (no contract, missing bank info, negative net, etc.)
- **WARNINGS** for review (attendance exceptions, overtime, unusual salary changes)

The backend **enforces** the block — disabling the Finalize button is only UX.

### 2. Explainable Payslip
Every payslip line is expandable and shows:
```
Rule: HRA
Input: BASIC = ₹30,000
Formula: BASIC × 20%
Result: ₹6,000
```

### 3. Contract Intelligence
The payroll engine resolves which contract(s) apply to a payroll period and **prorates wages** when multiple contracts cover different parts of the period.

### 4. Full Audit Trail
Every sensitive action (contract change, salary update, payrun finalization, leave approval) creates an audit record with old/new values.

---

## Theme

The UI supports **light and dark mode** via the sun/moon toggle in the top-right corner.

- Theme choice persists in `localStorage`
- OS preference is respected on first visit
- **No gradients** anywhere — flat solid colors throughout

---

## Technology Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend    | Node.js, Express, TypeScript            |
| Database   | PostgreSQL                              |
| ORM        | Prisma                                  |
| Auth       | JWT (jsonwebtoken) + bcryptjs           |
| Validation | Zod (backend) + react-hook-form (frontend) |
| PDF        | PDFKit                                  |

---

## Team

| Member   | Responsibility                                      |
|----------|-----------------------------------------------------|
| Member 1 | Frontend — HR Workspace (employees, contracts, attendance, leave) |
| Member 2 | Frontend — Payroll Workspace (dashboard, salary, payrun, validation, payslip, portal) |
| Member 3 | Backend — HR Services + Database                   |
| Member 4 | Backend — Auth + Payroll Engine + Validation + PDF + Audit |

See `docs/TEAM-TASKS.md` for the full checklist.
