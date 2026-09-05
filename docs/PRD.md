# PeoplePay360 — New Product Requirements Document (PRD)

**Version:** 2.0
**Project:** PeoplePay360
**Type:** Hackathon MVP
**Team:** 4 members
**Duration:** 24 hours
**Primary Goal:** Build a reliable, integrated HR-to-payroll operational platform that prevents incorrect payroll from being finalized.

---

# 1. Product Overview

**PeoplePay360** is an integrated employee and payroll management platform that connects the complete workforce lifecycle:

```text
Employee
   ↓
Contract
   ↓
Work Schedule
   ↓
Attendance
   ↓
Leave
   ↓
Salary Structure
   ↓
Payroll Computation
   ↓
Payroll Validation
   ↓
Payrun
   ↓
Explainable Payslip
   ↓
Employee Self-Service
```

The product is not positioned as another basic HR CRUD application.

Its core value is:

> **PeoplePay360 ensures that payroll is based on valid employee data, correct contracts, attendance, leave and salary rules—and prevents a payroll run containing critical errors from being finalized.**

---

# 2. Problem Statement

Organizations often maintain employee information, contracts, attendance, leave and payroll as disconnected processes.

This creates problems such as:

* Incorrect employee information
* Expired or missing contracts
* Multiple contracts being handled incorrectly
* Attendance inconsistencies
* Unapproved or incorrect leave
* Incorrect salary calculations
* Payroll errors discovered too late
* Poor visibility into why a salary was calculated
* Lack of accountability for changes
* Manual payroll verification

The most dangerous point is the final payroll stage.

Once payroll is finalized, mistakes can directly affect employee payments.

PeoplePay360 therefore makes **payroll validation and traceability** a central product capability.

---

# 3. Product Vision

### Vision

Build a trustworthy workforce operations platform where every payroll amount can be traced back to the employee's underlying data and business rules.

### Product principle

```text
Correct Data
     +
Correct Rules
     +
Validation
     +
Explainability
     +
Auditability
     =
Trustworthy Payroll
```

---

# 4. Target Users

PeoplePay360 supports five roles.

## 4.1 Super Admin
Responsible for:
* System administration
* User management
* Role assignment
* System configuration
* Audit log access

## 4.2 HR Manager
Responsible for:
* Employee management
* Contracts
* Work schedules
* Leave configuration
* Leave allocation
* Employee information

## 4.3 Payroll Officer
Responsible for:
* Salary structures
* Payruns
* Payroll computation
* Payroll validation
* Payroll finalization
* Payslips

## 4.4 Line Manager
Responsible for:
* Viewing team attendance
* Reviewing leave requests
* Approving/rejecting leave

## 4.5 Employee
Responsible for:
* Check-in/check-out
* Viewing attendance
* Requesting leave
* Viewing leave balance
* Viewing payslips
* Downloading payslips

---

# 5. Core User Journey

The primary business journey is:

```text
HR creates employee
        ↓
HR creates employee contract
        ↓
HR assigns working schedule
        ↓
Employee records attendance
        ↓
Employee requests leave
        ↓
Manager approves leave
        ↓
Payroll Officer creates payrun
        ↓
Payroll engine computes salary
        ↓
Validation engine checks payroll
        ↓
Critical issues?
     ↙          ↘
   YES           NO
    ↓             ↓
 Fix issues     Finalize
    ↓             ↓
 Recompute      Generate payslips
    ↓             ↓
 Revalidate     Employee receives/views
```

---

# 6. Core Modules

## Module 1 — Authentication & RBAC
* Secure login, JWT authentication, bcrypt password hashing.
* Role-based permissions across Super Admin, HR Manager, Payroll Officer, Line Manager, Employee.

## Module 2 — Employee Management
* Create, view, edit, search, filter employees.
* Track Employee ID/Code, full name, email, phone, department, designation, joining date, status, bank info.

## Module 3 — Contract Management
* Multiple contracts over time.
* Tracks contract type, start date, end date, basic wage, status (DRAFT, ACTIVE, EXPIRED, CANCELLED).
* Detect missing, expired, or overlapping contracts.
* Critical rule: If an employee has no valid contract for the payroll period, validation produces a CRITICAL error.

## Module 4 — Working Schedule
* Schedule name, working days, start time, end time, break duration, expected daily hours.

## Module 5 — Attendance
* Check-in/Check-out, worked hours calculation, exception tracking (missing punches, irregular hours).

## Module 6 — Leave / Time Off
* Configure leave types, allocate leave to employees.
* Submit requests, manager approve/reject.
* Real-time balance: `Remaining = Allocation - Approved Leave`.

## Module 7 — Salary Structure & Rules
* Salary structures with ordered rules: Basic → Allowances → Gross → Deductions → Net.

## Module 8 — Payroll Engine
* Deterministic backend computation taking employee, contract, schedule, attendance, approved leave, salary structure, and rules.

## Module 9 — Payroll Validation Cockpit
* Severities: CRITICAL, WARNING, INFO.
* Validates contract presence, overlap, bank info, negative net salary, duplicate payrun, attendance exceptions.

## Module 10 — Payroll Finalization Blocking
* `POST /api/payroll/payruns/:id/finalize` must strictly block if unresolved critical errors exist.

## Module 11 — Explainable Payslip
* Shows `Rule → Input → Formula → Result` breakdown for every component.

## Module 12 — Payslip PDF & Employee Portal
* View and download payslip PDF.
* Employee self-service dashboard.

## Module 13 — Audit Trail
* Captures who, what, when, old value, new value, and reason for all sensitive actions.
