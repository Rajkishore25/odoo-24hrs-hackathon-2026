# PeoplePay360 — API Contract

**Version:** 1.0  
**Status:** Team Contract — freeze before feature development

This document is the shared contract between the PeoplePay360 frontend and backend teams.

## 1. API Conventions

**Base URL:** `/api`

**Content-Type:** `application/json`

**Authentication:** Bearer JWT for protected endpoints.

### Success response

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

`details` is optional.

## 2. Common Rules

- IDs are UUID strings at the API layer.
- Dates use `YYYY-MM-DD`.
- Timestamps use ISO 8601 UTC strings.
- Monetary values are decimal numbers and must not be calculated in the frontend.
- Frontend must treat server responses as authoritative.
- Backend owns all business rules and authorization checks.
- Archived records are not hard-deleted unless explicitly specified.

## 3. Authentication

### POST `/api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "HR_MANAGER"
    }
  }
}
```

### POST `/api/auth/logout`

Protected endpoint. Client clears authentication state after successful response.

## 4. Employees

### GET `/api/employees`

Query parameters:

- `search` — optional
- `department` — optional
- `status` — optional
- `page` — optional, default `1`
- `limit` — optional, default `20`

Response shape:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "employeeCode": "EMP001",
        "name": "Rahul Kumar",
        "email": "rahul@example.com",
        "phone": "+91XXXXXXXXXX",
        "department": "Engineering",
        "designation": "Software Developer",
        "joiningDate": "2026-01-10",
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### GET `/api/employees/:id`

Returns the employee and summary information. Detailed related resources use their own endpoints.

### POST `/api/employees`

Request:

```json
{
  "employeeCode": "EMP001",
  "name": "Rahul Kumar",
  "email": "rahul@example.com",
  "phone": "+91XXXXXXXXXX",
  "department": "Engineering",
  "designation": "Software Developer",
  "joiningDate": "2026-01-10"
}
```

### PATCH `/api/employees/:id`

Partial update using the same writable fields as creation.

### DELETE `/api/employees/:id`

Archive/deactivate employee. Prefer soft delete.

## 5. Contracts

### GET `/api/employees/:employeeId/contracts`

Returns historical contracts sorted by `startDate` ascending.

### POST `/api/contracts`

Request:

```json
{
  "employeeId": "uuid",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "wage": 50000,
  "salaryStructureId": "uuid",
  "workingScheduleId": "uuid"
}
```

### PATCH `/api/contracts/:id`

Updates allowed contract fields. Backend must validate date ranges and overlaps.

### GET `/api/contracts/applicable`

Query parameters:

- `employeeId`
- `periodStart`
- `periodEnd`

Response:

```json
{
  "success": true,
  "data": {
    "contracts": [
      {
        "id": "uuid",
        "startDate": "2026-01-01",
        "endDate": "2026-03-15",
        "wage": 40000,
        "applicableDays": 15
      }
    ],
    "isValid": true
  }
}
```

The payroll engine uses the applicable contract data; frontend does not calculate contract applicability.

## 6. Working Schedules

### GET `/api/schedules`

### POST `/api/schedules`

Request:

```json
{
  "name": "Standard 9 to 6",
  "workingDays": ["MON", "TUE", "WED", "THU", "FRI"],
  "startTime": "09:00",
  "endTime": "18:00",
  "breakMinutes": 60
}
```

### PATCH `/api/schedules/:id`

### GET `/api/schedules/:id/expected-hours`

Query parameters:

- `periodStart`
- `periodEnd`
- `employeeId` (optional when schedule itself is queried)

Response:

```json
{
  "success": true,
  "data": {
    "scheduledDays": 22,
    "expectedHours": 176
  }
}
```

## 7. Attendance

### GET `/api/attendance`

Query parameters may include `employeeId`, `from`, `to`, `status`, and `exceptionOnly`.

### POST `/api/attendance/checkin`

```json
{
  "employeeId": "uuid"
}
```

### POST `/api/attendance/checkout`

```json
{
  "employeeId": "uuid"
}
```

### POST `/api/attendance`

Allows authorized users to create/import a daily attendance record.

### PATCH `/api/attendance/:id`

Used for authorized corrections.

### GET `/api/attendance/exceptions`

Returns unresolved and historical exceptions.

### PATCH `/api/attendance/exceptions/:id`

Request:

```json
{
  "status": "CORRECTED",
  "reason": "Checkout corrected after manager review"
}
```

Allowed exception statuses:

- `OPEN`
- `REVIEWED`
- `CORRECTED`
- `DISMISSED`

## 8. Time Off

### GET `/api/time-off/types`

### POST `/api/time-off/types`

Request:

```json
{
  "name": "Annual Leave",
  "isPaid": true,
  "unit": "DAYS"
}
```

### GET `/api/time-off/allocations`

### POST `/api/time-off/allocations`

```json
{
  "employeeId": "uuid",
  "timeOffTypeId": "uuid",
  "allocatedDays": 20,
  "validFrom": "2026-01-01",
  "validTo": "2026-12-31"
}
```

### GET `/api/time-off/requests`

### POST `/api/time-off/requests`

```json
{
  "employeeId": "uuid",
  "timeOffTypeId": "uuid",
  "startDate": "2026-09-15",
  "endDate": "2026-09-16",
  "reason": "Personal work"
}
```

### POST `/api/time-off/requests/:id/approve`

### POST `/api/time-off/requests/:id/reject`

Reject request should accept an optional reason:

```json
{
  "reason": "Insufficient team coverage"
}
```

Allowed request statuses:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`

### GET `/api/time-off/balance/:employeeId`

Returns balances by leave type.

## 9. Salary Structures

### GET `/api/salary-structures`

### POST `/api/salary-structures`

```json
{
  "name": "Regular Monthly",
  "description": "Standard monthly salary structure"
}
```

### PATCH `/api/salary-structures/:id`

## 10. Salary Rules

### GET `/api/salary-rules?structureId=:id`

Rules are returned sorted by ascending `sequence`.

### POST `/api/salary-rules`

Request:

```json
{
  "structureId": "uuid",
  "name": "HRA",
  "code": "HRA",
  "category": "EARNING",
  "sequence": 20,
  "calculationType": "PERCENTAGE",
  "value": 20,
  "dependsOnCode": "BASIC",
  "formulaDescription": "BASIC * 20%"
}
```

Allowed `category` values:

- `EARNING`
- `DEDUCTION`
- `NET`

Allowed `calculationType` values:

- `FIXED`
- `PERCENTAGE`
- `REFERENCE`

## 11. Payruns

### POST `/api/payruns`

Create a payrun.

Request:

```json
{
  "periodStart": "2026-09-01",
  "periodEnd": "2026-09-30",
  "employeeIds": ["uuid1", "uuid2"]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "DRAFT",
    "periodStart": "2026-09-01",
    "periodEnd": "2026-09-30",
    "employeeCount": 2
  }
}
```

### GET `/api/payruns`

### GET `/api/payruns/:id`

### POST `/api/payruns/:id/compute`

Computes draft payslips for the employees in the payrun.

### POST `/api/payruns/:id/validate`

Returns the validation result.

Response:

```json
{
  "success": true,
  "data": {
    "status": "BLOCKED",
    "criticalErrors": [
      {
        "code": "NO_ACTIVE_CONTRACT",
        "employeeId": "uuid",
        "message": "No applicable contract found for the payroll period"
      }
    ],
    "warnings": [
      {
        "code": "ATTENDANCE_EXCEPTION",
        "employeeId": "uuid",
        "message": "Unresolved attendance exception"
      }
    ],
    "summary": {
      "employeesChecked": 2,
      "criticalCount": 1,
      "warningCount": 1
    }
  }
}
```

### POST `/api/payruns/:id/finalize`

Rules:

- Payrun must be computed.
- Payrun must have zero critical validation errors.
- Finalization changes the state to `FINALIZED`.
- Finalization is audited.

### GET `/api/payruns/:id/payslips`

## 12. Payslips

### GET `/api/payslips/:id`

Response includes calculation lines:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "payrunId": "uuid",
    "gross": 50000,
    "totalDeductions": 5300,
    "net": 44700,
    "lines": [
      {
        "code": "HRA",
        "name": "HRA",
        "category": "EARNING",
        "inputValues": {
          "BASIC": 30000
        },
        "formulaDescription": "BASIC * 20%",
        "amount": 6000
      }
    ]
  }
}
```

### GET `/api/payslips/:id/pdf`

Returns the PDF document.

## 13. Dashboard

### GET `/api/dashboard`

Response should provide actionable KPIs and alerts, such as:

- employee count
- current payrun status
- pending leave requests
- attendance exceptions
- payroll warnings
- critical payroll issues

## 14. Audit Logs

### GET `/api/audit-logs`

Supports filters such as `userId`, `action`, `entityType`, `entityId`, `from`, and `to`.

## 15. HTTP Status Guidance

- `200` — successful read/update/action
- `201` — successful creation
- `400` — invalid request/business input
- `401` — unauthenticated
- `403` — authenticated but unauthorized
- `404` — resource not found
- `409` — conflict, such as duplicate payrun or contract overlap
- `422` — validation failure when semantically useful
- `500` — unexpected server error

## 16. Frontend/Backend Contract Rule

If an API shape must change:

1. Update this document.
2. Tell the affected frontend/backend owner.
3. Update mock data/types.
4. Test both sides.
5. Commit the contract change separately.

Do not silently change field names or statuses.
