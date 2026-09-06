import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { payrollApi } from '@/api/payroll';
import { Payrun } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';

const statusVariant: Record<string, 'draft' | 'in_progress' | 'validated' | 'finalized' | 'paid'> = {
  DRAFT: 'draft', IN_PROGRESS: 'in_progress', VALIDATED: 'validated',
  FINALIZED: 'finalized', PAID: 'paid',
};

// Only these roles can delete
const CAN_DELETE_ROLES = ['SUPER_ADMIN', 'HR_MANAGER'];

export function PayrunsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = CAN_DELETE_ROLES.includes(user?.role ?? '');

  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Payrun | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await payrollApi.listPayruns();
      setPayruns(res.data.data.items);
    } catch (err) {
      toast.error('Failed to load payruns', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await payrollApi.deletePayrun(deleteTarget.id);
      toast.success(`Payrun "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error('Failed to delete payrun', getApiError(err));
    } finally {
      setDeleting(false);
    }
  }

  const isFinalizedOrPaid = (pr: Payrun) =>
    pr.status === 'FINALIZED' || pr.status === 'PAID';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payruns"
        description="Manage payroll runs"
        actions={
          <Button onClick={() => navigate('/payruns/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Payrun
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : payruns.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No payruns yet"
          description="Create your first payrun to start processing payroll."
          action={<Button onClick={() => navigate('/payruns/new')}>Create Payrun</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Payrun', 'Period', 'Gross Total', 'Net Total', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payruns.map((pr) => (
                  <tr
                    key={pr.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/payruns/${pr.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{pr.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(pr.periodStart)} – {formatDate(pr.periodEnd)}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(pr.totalGross)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(pr.totalNet)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[pr.status] ?? 'draft'}>
                        {pr.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/payruns/${pr.id}`)}
                        >
                          Open
                        </Button>

                        {/* Delete — only for eligible roles, only non-finalized payruns */}
                        {canDelete && !isFinalizedOrPaid(pr) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-critical hover:bg-critical-muted"
                            title="Delete payrun"
                            onClick={() => setDeleteTarget(pr)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Finalized badge — not deletable */}
                        {canDelete && isFinalizedOrPaid(pr) && (
                          <span
                            className="text-xs text-muted-foreground px-2"
                            title="Finalized payruns cannot be deleted"
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-critical">
              <AlertTriangle className="h-5 w-5" />
              Delete Payrun?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-foreground">
              You are about to permanently delete{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>.
            </p>

            {/* Payrun details */}
            <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period</span>
                <span>
                  {deleteTarget ? `${formatDate(deleteTarget.periodStart)} – ${formatDate(deleteTarget.periodEnd)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusVariant[deleteTarget?.status ?? 'DRAFT'] ?? 'draft'}>
                  {deleteTarget?.status?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Total</span>
                <span className="font-medium">{formatCurrency(deleteTarget?.totalNet ?? 0)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-muted px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                This will permanently delete the payrun and all its draft payslips.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="critical"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>Deleting...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" /> Delete Payrun</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
