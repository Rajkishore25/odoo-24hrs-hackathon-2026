import { useEffect, useState, useCallback } from 'react';
import { FileText, Plus } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { Employee, Contract } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { ContractFormDialog } from './ContractFormDialog';

interface EmployeeWithContracts extends Employee {
  contracts: Contract[];
}

export function ContractsPage() {
  const [employees, setEmployees] = useState<EmployeeWithContracts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesApi.list({ status: 'ACTIVE', limit: '100' });
      const items: Employee[] = res.data.data.items;
      const withContracts = await Promise.all(
        items.map(async (emp) => {
          const cRes = await employeesApi.getContracts(emp.id);
          return { ...emp, contracts: cRes.data.data };
        })
      );
      setEmployees(withContracts);
    } catch (err) {
      toast.error('Failed to load contracts', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const contractStatus: Record<string, 'active' | 'draft' | 'archived'> = {
    ACTIVE: 'active', DRAFT: 'draft', EXPIRED: 'archived', CANCELLED: 'archived',
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contracts"
        description="Employee employment contracts"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Contract
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : employees.filter((e) => e.contracts.length > 0).length === 0 ? (
        <EmptyState icon={FileText} title="No contracts found" description="Add contracts to employees to enable payroll processing." />
      ) : (
        <div className="space-y-4">
          {employees
            .filter((e) => e.contracts.length > 0)
            .map((emp) => (
              <Card key={emp.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.employeeCode} · {emp.department ?? '—'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {emp.contracts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">{formatDate(c.startDate)}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="font-medium">{c.endDate ? formatDate(c.endDate) : 'Open-ended'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(c.wage)}/mo</span>
                          <Badge variant={contractStatus[c.status] ?? 'draft'}>{c.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <ContractFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); load(); }}
      />
    </div>
  );
}
