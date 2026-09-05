# PeoplePay360 — System Architecture

**Version:** 1.0

---

## 1. Overview

PeoplePay360 uses a modular client-server architecture.

The system consists of:

1. React frontend
2. Node.js + Express backend
3. PostgreSQL database
4. Prisma ORM
5. Authentication and authorization layer
6. Payroll business-rule engine
7. Validation engine
8. Payslip/PDF generation
9. Audit logging

The architecture is designed for:

- Clear separation of responsibilities
- Parallel development by four team members
- Strong data consistency
- Deterministic payroll computation
- Easy testing
- Simple deployment
- Fast hackathon development

---

# 2. High-Level Architecture

```text
                         PEOPLEPAY360
                              |
                 +------------+------------+
                 |                         |
                 v                         v
          React Frontend             Backend API
          TypeScript                Node + Express
                 |                         |
                 |                  +------+------+
                 |                  |             |
                 |                  v             v
                 |             Middleware     Services
                 |                  |             |
                 |                  |      +------+-------+
                 |                  |      |              |
                 |                  |      v              v
                 |                  |   HR Services   Payroll Services
                 |                  |                     |
                 |                  |              +------+------+
                 |                  |              |             |
                 |                  |              v             v
                 |                  |        Payroll Engine  Validation
                 |                  |
                 +------------------+
                            |
                            v
                         Prisma
                            |
                            v
                       PostgreSQL
```

---

# 3. Architecture Style

PeoplePay360 uses a **Modular Monolithic Architecture**.

The backend is one deployable application containing independent business modules:

```text
Backend
│
├── Authentication
├── Employee Management
├── Contract Management
├── Schedule Management
├── Attendance
├── Leave
├── Salary
├── Payroll
├── Payslip
├── Dashboard
└── Audit
```

---

# 4. Frontend Architecture

- React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Axios.
- Frontend displays data and captures input, but never calculates authoritative payroll numbers.

---

# 5. Backend Architecture & Request Flow

```text
HTTP Request
     ↓
Route
     ↓
Authentication Middleware
     ↓
Role Middleware
     ↓
Request Validation (Zod)
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL
     ↓
Service
     ↓
Controller
     ↓
HTTP Response
```

---

# 6. Four-Member Development Architecture

## Member 1 — Frontend HR
Employee, Contract, Schedule, Attendance, Leave

## Member 2 — Frontend Payroll
Authentication UI, Dashboard, Salary, Payroll, Validation, Payslip, Employee Portal

## Member 3 — Backend HR (Current Focus)
Database, Employee, Contract, Schedule, Attendance, Leave

## Member 4 — Backend Auth + Payroll
Authentication, RBAC, Salary, Payroll, Validation, Payslip, PDF, Audit

---

# 7. Core Architectural Principles

1. **Backend is the single source of truth** (no client-side math).
2. **Business logic lives in services**, not controllers or UI.
3. **Database consistency matters** (foreign keys, constraints, transactional payruns).
4. **Validation happens before finalization** (Critical errors block finalization).
5. **Every important mutation is audited**.
