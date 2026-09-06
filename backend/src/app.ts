import express from 'express';
import cors from 'cors';
import { config } from './config/env';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employees/employees.routes';
import contractRoutes from './modules/contracts/contracts.routes';
import scheduleRoutes from './modules/schedules/schedules.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import timeoffRoutes from './modules/timeoff/timeoff.routes';
import salaryRoutes from './modules/salary/salary.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import payslipRoutes from './modules/payslips/payslip.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import auditRoutes from './modules/audit/audit.routes';

// Employee contracts sub-route
import { Router } from 'express';
import { authenticate } from './middleware/auth';
import { requireRole } from './middleware/rbac';
import * as contractsController from './modules/contracts/contracts.controller';

// Middleware imports
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PeoplePay360 API', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Employee contracts sub-route: GET /api/employees/:employeeId/contracts
const employeeContractRouter = Router({ mergeParams: true });
employeeContractRouter.get(
  '/',
  authenticate,
  requireRole('HR_MANAGER', 'PAYROLL_OFFICER'),
  contractsController.getContractsByEmployee
);
app.use('/api/employees/:employeeId/contracts', employeeContractRouter);

app.use('/api/contracts', contractRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/time-off', timeoffRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/payruns', payrollRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);

// ── 404 + Error Handlers ──────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🚀 PeoplePay360 API running on http://localhost:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend: ${config.frontendUrl}\n`);
});

export default app;
