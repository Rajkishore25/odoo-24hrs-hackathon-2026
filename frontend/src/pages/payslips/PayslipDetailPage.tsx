import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { payrollApi } from '@/api/payroll';
import { Payslip, PayslipLine } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDate, formatCurrency, formatDateRange } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { cn } from '@/lib/utils';

export function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    payrollApi.getPayslip(id)
      .then((res) => setPayslip(res.data.data))
      .catch((err) => toast.error('Failed to load payslip', getApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function downloadPdf() {
    if (!id) return;
    setDownloading(true);
    try {
      const res = await payrollApi.downloadPdf(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('Download failed', getApiError(err));
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <LoadingState message="Loading payslip..." />;
  if (!payslip) return <div className="text-muted-foreground">Payslip not found</div>;

  const earningLines = payslip.lines
    .filter((l) => l.category === 'EARNING' && l.code !== 'GROSS')
    .sort((a, b) => a.sequence - b.sequence);

  const deductionLines = payslip.lines
    .filter((l) => l.category === 'DEDUCTION')
    .sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Payslip</h2>
          {payslip.payrun && (
            <p className="text-sm text-muted-foreground">
              {payslip.payrun.name} · {formatDateRange(payslip.payrun.periodStart, payslip.payrun.periodEnd)}
            </p>
          )}
        </div>
        <Button onClick={downloadPdf} disabled={downloading} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </div>

      {/* Employee Info */}
      {payslip.employee && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                  {payslip.employee.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{payslip.employee.name}</p>
                  <p className="text-sm text-muted-foreground">{payslip.employee.employeeCode}</p>
                  {payslip.employee.department && (
                    <p className="text-xs text-muted-foreground">{payslip.employee.department} · {payslip.employee.designation}</p>
                  )}
                </div>
              </div>
              <Badge variant={payslip.status === 'PAID' ? 'paid' : 'computed' as any}>
                {payslip.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-success">EARNINGS</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {earningLines.map((line) => (
            <ExplainableLine
              key={line.id ?? line.code}
              line={line}
              expanded={expandedLine === line.code}
              onToggle={() => setExpandedLine(expandedLine === line.code ? null : line.code)}
            />
          ))}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/50">
            <span className="text-sm font-semibold">Gross Salary</span>
            <span className="text-sm font-bold text-foreground">{formatCurrency(payslip.gross)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Deductions */}
      {deductionLines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-critical">DEDUCTIONS</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {deductionLines.map((line) => (
              <ExplainableLine
                key={line.id ?? line.code}
                line={line}
                expanded={expandedLine === line.code}
                onToggle={() => setExpandedLine(expandedLine === line.code ? null : line.code)}
              />
            ))}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/50">
              <span className="text-sm font-semibold">Total Deductions</span>
              <span className="text-sm font-bold text-critical">{formatCurrency(payslip.totalDeductions)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Net Pay */}
      <Card className="border-success/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">NET PAY</p>
              <p className="text-3xl font-bold text-success mt-1">{formatCurrency(payslip.net)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground space-y-1">
              <p>Gross: {formatCurrency(payslip.gross)}</p>
              <p>Deductions: − {formatCurrency(payslip.totalDeductions)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explainability note */}
      <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info-muted p-3">
        <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-info">
          Click on any salary line above to see the exact formula and input values used to calculate that amount.
          Every number is fully traceable to the underlying salary rules.
        </p>
      </div>
    </div>
  );
}

function ExplainableLine({
  line, expanded, onToggle,
}: {
  line: PayslipLine;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasExplanation = line.formulaDescription || Object.keys(line.inputValues ?? {}).length > 0;
  const isDeduction = line.category === 'DEDUCTION';

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors text-left"
        onClick={hasExplanation ? onToggle : undefined}
        disabled={!hasExplanation}
      >
        <div className="flex items-center gap-2">
          {hasExplanation ? (
            expanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <div className="w-4" />
          )}
          <span className="text-sm font-medium">{line.name}</span>
        </div>
        <span className={cn(
          'text-sm font-semibold',
          isDeduction ? 'text-critical' : 'text-foreground'
        )}>
          {isDeduction ? '− ' : ''}{formatCurrency(line.amount)}
        </span>
      </button>

      {/* Explanation panel */}
      {expanded && hasExplanation && (
        <div className="px-5 pb-4 ml-6 space-y-2">
          <div className="rounded-md border border-border bg-muted p-3 space-y-2">
            {/* Rule code */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold bg-background border border-border rounded px-2 py-0.5">
                {line.code}
              </span>
              <span className="text-xs text-muted-foreground">{line.name}</span>
            </div>

            {/* Input values */}
            {line.inputValues && Object.keys(line.inputValues).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Inputs</p>
                <div className="space-y-0.5">
                  {Object.entries(line.inputValues).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="font-mono text-muted-foreground">{key}</span>
                      <span className="font-medium">{formatCurrency(Number(value))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formula */}
            {line.formulaDescription && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Formula</p>
                <p className="text-xs font-mono text-foreground">{line.formulaDescription}</p>
              </div>
            )}

            {/* Result */}
            <div className="border-t border-border pt-2 flex justify-between text-xs font-semibold">
              <span>Result</span>
              <span className={isDeduction ? 'text-critical' : 'text-success'}>
                {formatCurrency(line.amount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
