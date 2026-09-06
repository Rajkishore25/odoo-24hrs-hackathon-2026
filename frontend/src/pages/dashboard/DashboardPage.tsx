import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, Calendar, CheckCircle2,
  XCircle, AlertTriangle, DollarSign,
  PlayCircle, Shield, ScrollText, Settings,
} from 'lucide-react';
import { payrollApi } from '@/api/payroll';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

interface DashboardData {
  employees: { total: number; active: number; inactive: number };
  leave: { pendingRequests: number };
  attendance: { openExceptions: number; todayCount: number };
  payroll: {
    currentPayrun: {
      id: string; name: string; status: string;
      periodStart: string; periodEnd: string; employeeCount: number;
    } | null;
    validationStatus: {
      payrunId: string; status: string;
      criticalCount: number; warningCount: number; canFinalize: boolean;
    } | null;
    lastFinalized: {
      id: string; name: string; totalGross: number;
      totalDeductions: number; totalNet: number; finalizedAt: string;
      _count: { payslips: number };
    } | null;
    recentPayruns: Array<{
      id: string; name: string; status: string;
      periodStart: string; periodEnd: string; totalNet: number;
      _count: { payslips: number };
    }>;
  };
}

const statusVariant: Record<string, 'draft' | 'in_progress' | 'validated' | 'finalized' | 'paid'> = {
  DRAFT: 'draft', IN_PROGRESS: 'in_progress', VALIDATED: 'validated',
  FINALIZED: 'finalized', PAID: 'paid',
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { criticalTotal, warningTotal } = useNotifications();
  const navigate = useNavigate();

  const role = user?.role;
  const isAdmin = role === 'SUPER_ADMIN';
  const isPayroll = role === 'PAYROLL_OFFICER';
  const isHR = role === 'HR_MANAGER';
  const isLineManager = role === 'LINE_MANAGER';
  const showPayrollSection = isAdmin || isPayroll || isHR;

  useEffect(() => {
    payrollApi.getDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (!data) return <p className="text-muted-foreground">Failed to load dashboard.</p>;

  const { employees, leave, attendance, payroll } = data;
  const vs = payroll.validationStatus;

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 border border-primary/20">
                  <Shield className="h-3 w-3" /> Super Admin
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Good {getGreeting()},{' '}
              <span className="text-primary">
                {user?.employee?.name ?? user?.email?.split('@')[0]}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin
                ? 'Full system overview — HR, Payroll, and Administration.'
                : isPayroll
                ? "Here's your payroll operations overview."
                : isHR
                ? "Here's your HR workspace overview."
                : isLineManager
                ? "Here's your team management overview."
                : "Here's what's happening today."}
            </p>
          </div>

          {/* Payroll status pill */}
          {showPayrollSection && vs && (
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border shrink-0 ${
              vs.criticalCount > 0
                ? 'border-critical/30 bg-critical-muted text-critical'
                : vs.warningCount > 0
                ? 'border-warning/30 bg-warning-muted text-warning'
                : 'border-success/30 bg-success-muted text-success'
            }`}>
              {vs.criticalCount > 0 ? (
                <><XCircle className="h-3.5 w-3.5" /> {vs.criticalCount} critical issue{vs.criticalCount > 1 ? 's' : ''}</>
              ) : vs.warningCount > 0 ? (
                <><AlertTriangle className="h-3.5 w-3.5" /> {vs.warningCount} warning{vs.warningCount > 1 ? 's' : ''}</>
              ) : (
                <><CheckCircle2 className="h-3.5 w-3.5" /> Payroll clear</>
              )}
            </div>
          )}
        </div>

        {/* Blocked payrun alert — inside hero */}
        {showPayrollSection && vs && vs.criticalCount > 0 && payroll.currentPayrun && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-critical/30 bg-critical-muted px-4 py-3 gap-4">
            <div>
              <p className="text-sm font-semibold text-critical">
                Payrun blocked — {vs.criticalCount} critical issue{vs.criticalCount > 1 ? 's' : ''} must be resolved
              </p>
              <p className="text-xs text-critical/80 mt-0.5">
                {payroll.currentPayrun.name} cannot be finalized. Check the bell icon for details.
              </p>
            </div>
            <Button size="sm" variant="critical" className="shrink-0"
              onClick={() => navigate(`/payruns/${payroll.currentPayrun!.id}/validation`)}>
              <XCircle className="mr-2 h-3.5 w-3.5" /> Open Cockpit
            </Button>
          </div>
        )}
      </div>

      {/* ── KPI Stats (all roles) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Employees" value={employees.total} icon={Users} />
        <StatCard label="Active Employees" value={employees.active} icon={Users} variant="success" />
        <StatCard
          label="Pending Leave"
          value={leave.pendingRequests}
          icon={Calendar}
          variant={leave.pendingRequests > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Open Exceptions"
          value={attendance.openExceptions}
          icon={Clock}
          variant={attendance.openExceptions > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* ── SUPER_ADMIN: Admin Quick Actions ─────────────────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Employees', icon: Users, path: '/employees', desc: 'Manage workforce' },
            { label: 'Payruns', icon: PlayCircle, path: '/payruns', desc: 'Payroll runs' },
            { label: 'Audit Logs', icon: ScrollText, path: '/audit-logs', desc: 'Trace changes' },
            { label: 'Leave Approvals', icon: Calendar, path: '/time-off', desc: 'HR leave queue' },
          ].map(({ label, icon: Icon, path, desc }) => (
            <Card
              key={label}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(path)}
            >
              <CardContent className="p-4 flex flex-col gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Payroll section (Admin + HR + Payroll Officer) ────────────────── */}
      {showPayrollSection && (
        <>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payroll Overview</span>
              <Separator className="flex-1" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Current Payrun */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Current Payrun</CardTitle>
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {payroll.currentPayrun ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{payroll.currentPayrun.name}</span>
                      <Badge variant={statusVariant[payroll.currentPayrun.status] ?? 'draft'}>
                        {payroll.currentPayrun.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Period: {formatDate(payroll.currentPayrun.periodStart)} – {formatDate(payroll.currentPayrun.periodEnd)}</p>
                      <p>Employees: {payroll.currentPayrun.employeeCount}</p>
                    </div>
                    {vs && (
                      <div className="flex gap-3 text-xs pt-1 border-t border-border">
                        <span className={vs.criticalCount > 0 ? 'text-critical font-semibold' : 'text-muted-foreground'}>
                          <XCircle className="inline h-3 w-3 mr-1" />{vs.criticalCount} critical
                        </span>
                        <span className={vs.warningCount > 0 ? 'text-warning' : 'text-muted-foreground'}>
                          <AlertTriangle className="inline h-3 w-3 mr-1" />{vs.warningCount} warnings
                        </span>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full"
                      onClick={() => navigate(`/payruns/${payroll.currentPayrun!.id}`)}>
                      Open Payrun
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <PlayCircle className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                    <p className="text-sm text-muted-foreground">No active payrun</p>
                    <Button size="sm" className="mt-3" onClick={() => navigate('/payruns/new')}>
                      Create Payrun
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last Finalized */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Last Finalized Payrun</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {payroll.lastFinalized ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{payroll.lastFinalized.name}</span>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div className="space-y-1.5">
                      {([
                        ['Gross', payroll.lastFinalized.totalGross, 'text-foreground'],
                        ['Deductions', payroll.lastFinalized.totalDeductions, 'text-warning'],
                        ['Net Pay', payroll.lastFinalized.totalNet, 'text-success font-semibold'],
                      ] as [string, number, string][]).map(([label, val, cls]) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className={cls}>{formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground border-t border-border pt-2">
                      {payroll.lastFinalized._count.payslips} payslips · Finalized {formatDate(payroll.lastFinalized.finalizedAt)}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <DollarSign className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                    <p className="text-sm text-muted-foreground">No finalized payruns yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Payruns table */}
          {payroll.recentPayruns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Recent Payruns</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/payruns')}>View all</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Name', 'Period', 'Net Total', 'Status'].map((h) => (
                        <th key={h} className={`px-6 py-3 text-xs font-medium text-muted-foreground ${h === 'Net Total' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.recentPayruns.map((pr) => (
                      <tr key={pr.id}
                        className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/payruns/${pr.id}`)}>
                        <td className="px-6 py-3 font-medium">{pr.name}</td>
                        <td className="px-6 py-3 text-muted-foreground text-xs">
                          {pr.periodStart ? `${formatDate(pr.periodStart)} – ${formatDate(pr.periodEnd)}` : '—'}
                        </td>
                        <td className="px-6 py-3 text-right font-medium">{formatCurrency(pr.totalNet)}</td>
                        <td className="px-6 py-3 text-center">
                          <Badge variant={statusVariant[pr.status] ?? 'draft'}>{pr.status.replace('_', ' ')}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── SUPER_ADMIN: HR Overview section ─────────────────────────────── */}
      {isAdmin && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HR Overview</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Workforce</p>
                  <p className="text-2xl font-bold">{employees.active}</p>
                  <p className="text-xs text-muted-foreground">of {employees.total} active</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/employees')}>Manage</Button>
              </CardContent>
            </Card>
            <Card className={leave.pendingRequests > 0 ? 'border-warning/30' : ''}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Calendar className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Leave Queue</p>
                  <p className="text-2xl font-bold">{leave.pendingRequests}</p>
                  <p className="text-xs text-muted-foreground">pending requests</p>
                </div>
                <Button size="sm" variant={leave.pendingRequests > 0 ? 'warning' : 'outline'}
                  onClick={() => navigate('/time-off')}>
                  Review
                </Button>
              </CardContent>
            </Card>
            <Card className={attendance.openExceptions > 0 ? 'border-warning/30' : ''}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                  <Clock className="h-6 w-6 text-info" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Exceptions</p>
                  <p className="text-2xl font-bold">{attendance.openExceptions}</p>
                  <p className="text-xs text-muted-foreground">open attendance issues</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/attendance')}>Review</Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ── Line Manager section ──────────────────────────────────────────── */}
      {isLineManager && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Leave Requests</p>
                <p className="text-2xl font-bold">{leave.pendingRequests}</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/time-off')}>Review</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Exceptions</p>
                <p className="text-2xl font-bold">{attendance.openExceptions}</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/attendance')}>Review</Button>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
