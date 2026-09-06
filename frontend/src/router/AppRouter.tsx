import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EmployeesPage } from '@/pages/employees/EmployeesPage';
import { EmployeeDetailPage } from '@/pages/employees/EmployeeDetailPage';
import { ContractsPage } from '@/pages/contracts/ContractsPage';
import { SchedulesPage } from '@/pages/schedules/SchedulesPage';
import { AttendancePage } from '@/pages/attendance/AttendancePage';
import { TimeOffPage } from '@/pages/timeoff/TimeOffPage';
import { SalaryPage } from '@/pages/salary/SalaryPage';
import { PayrunsPage } from '@/pages/payroll/PayrunsPage';
import { PayrunDetailPage } from '@/pages/payroll/PayrunDetailPage';
import { ValidationCockpitPage } from '@/pages/payroll/ValidationCockpitPage';
import { PayslipDetailPage } from '@/pages/payslips/PayslipDetailPage';
import { AuditLogsPage } from '@/pages/audit/AuditLogsPage';
import { EmployeePortalPage } from '@/pages/portal/EmployeePortalPage';
import { HRProfilePage } from '@/pages/hr/HRProfilePage';

const HR_ONLY       = ['SUPER_ADMIN', 'HR_MANAGER'];
const PAYROLL_ONLY  = ['SUPER_ADMIN', 'PAYROLL_OFFICER'];
const HR_AND_PAYROLL = ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'];
const ALL_STAFF     = ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'LINE_MANAGER'];

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — all authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* HR Workspace — shared between HR and Admin */}
          <Route element={<ProtectedRoute allowedRoles={HR_AND_PAYROLL} />}>
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={HR_ONLY} />}>
            <Route path="/schedules" element={<SchedulesPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={ALL_STAFF} />}>
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/time-off" element={<TimeOffPage />} />
          </Route>

          {/* HR Profile — HR_MANAGER only (leave balance + request leave) */}
          <Route element={<ProtectedRoute allowedRoles={['HR_MANAGER']} />}>
            <Route path="/hr-profile" element={<HRProfilePage />} />
          </Route>

          {/* Payroll Workspace — Payroll Officer + Admin only (NOT HR_MANAGER) */}
          <Route element={<ProtectedRoute allowedRoles={PAYROLL_ONLY} />}>
            <Route path="/salary" element={<SalaryPage />} />
            <Route path="/payruns" element={<PayrunsPage />} />
            <Route path="/payruns/new" element={<PayrunDetailPage />} />
            <Route path="/payruns/:id" element={<PayrunDetailPage />} />
            <Route path="/payruns/:id/validation" element={<ValidationCockpitPage />} />
            <Route path="/payslips" element={<PayrunsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Payslip detail — accessible to ALL authenticated users.
              Backend enforces that employees can only view their own payslip. */}
          <Route path="/payslips/:id" element={<PayslipDetailPage />} />

          {/* Employee portal */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/portal" element={<EmployeePortalPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
