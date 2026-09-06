import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Shield, CheckCircle2, Loader2,
  Users, TrendingDown, DollarSign
} from 'lucide-react';
import { payrollApi } from '@/api/payroll';
import { employeesApi } from '@/api/employees';
import { Payrun, Employee } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDate, formatCurrency, formatDateRange } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';

const statusVariant: Record<string, 'draft' | 'in_progress' | 'validated' | 'finalized' | 'paid'> = {
  DRAFT: 'draft', IN_PROGRESS: 'in_progress', VALIDATED: 'validated',
  FINALIZED: 'finalized', PAID: 'paid',
};

type PayrunStep = 'create' | 'detail';

export function PayrunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [payrun, setPayrun] = useState<Payrun & { payslips?: unknown[] } | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [step, setStep] = useState<PayrunStep>(isNew ? 'create' : 'detail');

  // Create form state
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [creating, setCreating] = useState(false);

  // Action states
  const [computing, setComputing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      payrollApi.getPayrun(id)
        .then((res) => setPayrun(res.data.data))
        .catch((err) => toast.error('Failed to load payrun', getApiError(err)))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  useEffect(() => {
    if (isNew) {
      setLoadingEmployees(true);
      employeesApi.list({ status: 'ACTIVE', limit: '100' })
        .then((res) => {
          setEmployees(res.data.data.items);
          setSelectedEmpIds(res.data.data.items.map((e: Employee) => e.id)); // all selected by default
        })
        .catch(console.error)
        .finally(() => setLoadingEmployees(false));
    }
  }, [isNew]);

  async function handleCreate() {
    if (!periodStart || !periodEnd || selectedEmpIds.length === 0) {
      toast.error('Please select a period and at least one employee');
      return;
    }
    setCreating(true);
    try {
      const res = await payrollApi.createPayrun({ periodStart, periodEnd, employeeIds: selectedEmpIds });
      toast.success('Payrun created');
      navigate(`/payruns/${res.data.data.id}`);
    } catch (err) {
      toast.error('Failed to create payrun', getApiError(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleCompute() {
    if (!payrun) return;
    setComputing(true);
    try {
      await payrollApi.computePayrun(payrun.id);
      toast.success('Payroll computed successfully');
      const res = await payrollApi.getPayrun(payrun.id);
      setPayrun(res.data.data);
    } catch (err) {
      toast.error('Compute failed', getApiError(err));
    } finally {
      setComputing(false);
    }
  }

  async function handleValidate() {
    if (!payrun) return;
    setValidating(true);
    try {
      await payrollApi.validatePayrun(payrun.id);
      toast.success('Validation complete');
      navigate(`/payruns/${payrun.id}/validation`);
    } catch (err) {
      toast.error('Validation failed', getApiError(err));
    } finally {
      setValidating(false);
    }
  }

  async function handleFinalize() {
    if (!payrun) return;
    setFinalizing(true);
    try {
      await payrollApi.finalizePayrun(payrun.id);
      toast.success('Payrun finalized!');
      setShowFinalizeConfirm(false);
      const res = await payrollApi.getPayrun(payrun.id);
      setPayrun(res.data.data);
    } catch (err) {
      toast.error('Finalization blocked', getApiError(err));
      navigate(`/payruns/${payrun.id}/validation`);
    } finally {
      setFinalizing(false);
    }
  }

  const toggleEmployee = (empId: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // ── Create wizard ────────────────────────────────────────────────────────────
  if (isNew) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payruns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader title="New Payrun" description="Set up a new payroll run" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">1. Select Period</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Period Start <span className="text-critical">*</span></Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Period End <span className="text-critical">*</span></Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">2. Select Employees</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedEmpIds(employees.map((e) => e.id))}>
                  Select All
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedEmpIds([])}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEmployees ? <LoadingState size="sm" /> : (
              <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmpIds.includes(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.employeeCode} · {emp.department ?? '—'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">{selectedEmpIds.length} employee(s) selected</p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/payruns')}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating || !periodStart || !periodEnd || selectedEmpIds.length === 0}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Payrun
          </Button>
        </div>
      </div>
    );
  }

  // ── Payrun detail ────────────────────────────────────────────────────────────
  if (loading) return <LoadingState />;
  if (!payrun) return <div className="text-muted-foreground">Payrun not found</div>;

  const canCompute = ['DRAFT', 'IN_PROGRESS', 'VALIDATED'].includes(payrun.status);
  const canValidate = ['IN_PROGRESS', 'VALIDATED'].includes(payrun.status);
  const canFinalize = payrun.status === 'VALIDATED';
  const isFinalized = ['FINALIZED', 'PAID'].includes(payrun.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/payruns')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{payrun.name}</h2>
              <Badge variant={statusVariant[payrun.status] ?? 'draft'}>
                {payrun.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(payrun.periodStart, payrun.periodEnd)}
            </p>
          </div>

          {/* Primary action buttons */}
          <div className="flex gap-2">
            {canCompute && (
              <Button onClick={handleCompute} disabled={computing} variant="outline">
                {computing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {computing ? 'Computing...' : 'Compute'}
              </Button>
            )}
            {canValidate && (
              <Button onClick={handleValidate} disabled={validating} variant="outline">
                {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                {validating ? 'Validating...' : 'Validate'}
              </Button>
            )}
            {canFinalize && (
              <Button onClick={() => setShowFinalizeConfirm(true)} variant="success">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize
              </Button>
            )}
            {!isFinalized && canValidate && (
              <Button variant="ghost" onClick={() => navigate(`/payruns/${payrun.id}/validation`)}>
                View Validation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Gross" value={formatCurrency(payrun.totalGross)} icon={DollarSign} />
        <StatCard label="Total Deductions" value={formatCurrency(payrun.totalDeductions)} icon={TrendingDown} variant="warning" />
        <StatCard label="Net Payable" value={formatCurrency(payrun.totalNet)} icon={CheckCircle2} variant="success" />
      </div>

      {/* Payslips table */}
      {(payrun as any).payslips && (payrun as any).payslips.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Employee Payslips</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Employee', 'Gross', 'Deductions', 'Net', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(payrun as any).payslips.map((ps: any) => (
                  <tr key={ps.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{ps.employee?.name}</p>
                      <p className="text-xs text-muted-foreground">{ps.employee?.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(ps.gross)}</td>
                    <td className="px-4 py-3 text-warning">{formatCurrency(ps.totalDeductions)}</td>
                    <td className="px-4 py-3 font-semibold text-success">{formatCurrency(ps.net)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ps.status === 'PAID' ? 'paid' : ps.status === 'COMPUTED' ? 'in_progress' : 'draft'}>
                        {ps.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {isFinalized && (
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/payslips/${ps.id}`)}>
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Finalize confirmation */}
      <Dialog open={showFinalizeConfirm} onOpenChange={setShowFinalizeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Payrun?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>You are about to finalize <strong className="text-foreground">{payrun.name}</strong>.</p>
            <p>This will:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Lock the payrun from further editing</li>
              <li>Freeze all payslip calculations</li>
              <li>Generate payslip PDFs</li>
              <li>Create an audit record</li>
            </ul>
            <p className="text-critical font-medium mt-2">This action requires zero critical validation errors.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinalizeConfirm(false)}>Cancel</Button>
            <Button variant="success" onClick={handleFinalize} disabled={finalizing}>
              {finalizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Finalize Payrun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
