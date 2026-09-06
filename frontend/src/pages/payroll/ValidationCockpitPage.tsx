import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, XCircle, AlertTriangle, CheckCircle2,
  RefreshCw, Loader2, Shield, ChevronRight
} from 'lucide-react';
import { payrollApi } from '@/api/payroll';
import { ValidationResult, ValidationIssue } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { cn } from '@/lib/utils';

interface PayrunInfo {
  id: string;
  name: string;
  status: string;
  periodStart: string;
  periodEnd: string;
}

export function ValidationCockpitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payrun, setPayrun] = useState<PayrunInfo | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    try {
      const [prRes, valRes] = await Promise.all([
        payrollApi.getPayrun(id),
        payrollApi.validatePayrun(id),
      ]);
      setPayrun(prRes.data.data);
      setValidation(valRes.data.data);
    } catch (err) {
      toast.error('Failed to load validation', getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [id]);

  async function revalidate() {
    if (!id) return;
    setRevalidating(true);
    try {
      const res = await payrollApi.validatePayrun(id);
      setValidation(res.data.data);
      toast.success('Revalidation complete');
    } catch (err) {
      toast.error('Revalidation failed', getApiError(err));
    } finally {
      setRevalidating(false);
    }
  }

  async function handleFinalize() {
    if (!id || !validation?.canFinalize) return;
    setFinalizing(true);
    try {
      await payrollApi.finalizePayrun(id);
      toast.success('Payrun finalized successfully!');
      navigate(`/payruns/${id}`);
    } catch (err) {
      toast.error('Finalization blocked', getApiError(err));
      revalidate();
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) return <LoadingState message="Running validation checks..." />;
  if (!payrun || !validation) return <div className="text-muted-foreground">Validation data not available</div>;

  const criticalIssues = validation.issues.filter((i) => i.severity === 'CRITICAL');
  const warningIssues = validation.issues.filter((i) => i.severity === 'WARNING');
  const infoIssues = validation.issues.filter((i) => i.severity === 'INFO');

  const isBlocked = validation.status === 'BLOCKED';
  const isClear = validation.status === 'CLEAR';

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/payruns/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Validation Cockpit</h2>
          <p className="text-sm text-muted-foreground">{payrun.name} · {formatDate(payrun.periodStart)} – {formatDate(payrun.periodEnd)}</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={cn(
        'rounded-lg border p-5 flex items-center justify-between',
        isBlocked ? 'border-critical/30 bg-critical-muted' :
        validation.status === 'WARNINGS_ONLY' ? 'border-warning/30 bg-warning-muted' :
        'border-success/30 bg-success-muted'
      )}>
        <div className="flex items-center gap-4">
          {isBlocked ? (
            <XCircle className="h-8 w-8 text-critical shrink-0" />
          ) : isClear ? (
            <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-warning shrink-0" />
          )}
          <div>
            <p className={cn(
              'text-lg font-bold',
              isBlocked ? 'text-critical' :
              isClear ? 'text-success' : 'text-warning'
            )}>
              {isBlocked ? 'PAYRUN BLOCKED' :
               isClear ? 'READY TO FINALIZE' : 'WARNINGS ONLY'}
            </p>
            <p className={cn(
              'text-sm',
              isBlocked ? 'text-critical/80' :
              isClear ? 'text-success/80' : 'text-warning/80'
            )}>
              {isBlocked
                ? `${validation.criticalCount} critical issue${validation.criticalCount > 1 ? 's' : ''} must be resolved before finalization`
                : isClear
                ? 'No critical issues. Payrun is safe to finalize.'
                : `${validation.warningCount} warning${validation.warningCount > 1 ? 's' : ''} found. Review before finalizing.`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={revalidate} disabled={revalidating}>
            {revalidating
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <RefreshCw className="mr-2 h-4 w-4" />
            }
            {revalidating ? 'Revalidating...' : 'Revalidate'}
          </Button>

          <Button
            variant={validation.canFinalize ? 'success' : 'outline'}
            size="sm"
            disabled={!validation.canFinalize || finalizing}
            onClick={handleFinalize}
            title={!validation.canFinalize ? 'Resolve all critical issues first' : 'Finalize payrun'}
          >
            {finalizing
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <CheckCircle2 className="mr-2 h-4 w-4" />
            }
            {finalizing ? 'Finalizing...' : 'Finalize Payrun'}
          </Button>
        </div>
      </div>

      {/* Summary counts */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-critical/30 bg-critical-muted">
          <XCircle className="h-4 w-4 text-critical" />
          <span className="text-sm font-semibold text-critical">{validation.criticalCount} Critical</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-warning/30 bg-warning-muted">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-warning">{validation.warningCount} Warning{validation.warningCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{validation.employeesChecked} employee{validation.employeesChecked !== 1 ? 's' : ''} checked</span>
        </div>
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-critical flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Critical Issues — Must Resolve
          </h3>
          {criticalIssues.map((issue, idx) => (
            <ValidationIssueCard key={idx} issue={issue} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {warningIssues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Warnings — Review Recommended
          </h3>
          {warningIssues.map((issue, idx) => (
            <ValidationIssueCard key={idx} issue={issue} />
          ))}
        </div>
      )}

      {/* All clear */}
      {validation.issues.length === 0 && (
        <Card className="border-success/30">
          <CardContent className="flex items-center gap-4 p-6">
            <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
            <div>
              <p className="font-semibold text-success">All checks passed</p>
              <p className="text-sm text-muted-foreground">
                {validation.employeesChecked} employee{validation.employeesChecked !== 1 ? 's' : ''} validated without issues.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ValidationIssueCard({ issue }: { issue: ValidationIssue }) {
  const navigate = useNavigate();
  const isCritical = issue.severity === 'CRITICAL';

  return (
    <Card className={cn(
      'border transition-colors',
      isCritical ? 'border-critical/30' : 'border-warning/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {isCritical
              ? <XCircle className="h-5 w-5 text-critical shrink-0 mt-0.5" />
              : <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            }
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{issue.employeeName}</span>
                <span className="text-xs text-muted-foreground font-mono">{issue.employeeCode}</span>
                <Badge variant={isCritical ? 'critical' : 'warning'} className="text-xs">
                  {issue.code.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-sm text-foreground">{issue.message}</p>
              <p className="text-xs text-muted-foreground">
                💡 {issue.suggestedAction}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0"
            onClick={() => navigate(`/employees/${issue.employeeId}`)}
          >
            Fix <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
