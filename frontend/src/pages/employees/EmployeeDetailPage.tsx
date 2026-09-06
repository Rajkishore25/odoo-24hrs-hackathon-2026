import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, FileText, Clock, Umbrella, Receipt } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { Employee, Contract } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { ContractFormDialog } from '../contracts/ContractFormDialog';

interface EmployeeDetail extends Employee {
  contracts: Contract[];
  _count: { attendances: number; timeOffRequests: number; payslips: number };
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await employeesApi.get(id);
      setEmployee(res.data.data);
    } catch (err) {
      toast.error('Failed to load employee', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <LoadingState />;
  if (!employee) return <div className="text-muted-foreground">Employee not found</div>;

  const contractStatusVariant: Record<string, 'active' | 'draft' | 'archived'> = {
    ACTIVE: 'active', DRAFT: 'draft', EXPIRED: 'archived', CANCELLED: 'archived',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{employee.name}</h2>
            <Badge variant={employee.status === 'ACTIVE' ? 'active' : employee.status === 'INACTIVE' ? 'inactive' : 'archived'}>
              {employee.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{employee.employeeCode} · {employee.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Attendance Records', value: employee._count.attendances, icon: Clock },
          { label: 'Leave Requests', value: employee._count.timeOffRequests, icon: Umbrella },
          { label: 'Payslips', value: employee._count.payslips, icon: Receipt },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts ({employee.contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  ['Employee Code', employee.employeeCode],
                  ['Full Name', employee.name],
                  ['Email', employee.email],
                  ['Phone', employee.phone ?? '—'],
                  ['Department', employee.department ?? '—'],
                  ['Designation', employee.designation ?? '—'],
                  ['Joining Date', formatDate(employee.joiningDate)],
                  ['Bank', employee.bankName ?? '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowContractForm(true)}>
                <FileText className="mr-2 h-4 w-4" /> Add Contract
              </Button>
            </div>

            {employee.contracts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No contracts"
                description="Add a contract to enable payroll processing for this employee."
                action={<Button size="sm" onClick={() => setShowContractForm(true)}>Add Contract</Button>}
              />
            ) : (
              <div className="space-y-3">
                {employee.contracts.map((contract) => (
                  <Card key={contract.id} className={contract.status === 'ACTIVE' ? 'border-success/30' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatDate(contract.startDate)} → {contract.endDate ? formatDate(contract.endDate) : 'Open-ended'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {contract.salaryStructure?.name} · {contract.workingSchedule?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">{formatCurrency(contract.wage)}</span>
                          <Badge variant={contractStatusVariant[contract.status] ?? 'draft'}>
                            {contract.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <EmployeeFormDialog
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={() => { setShowEditForm(false); load(); }}
        employee={employee}
      />
      <ContractFormDialog
        open={showContractForm}
        onClose={() => setShowContractForm(false)}
        onSuccess={() => { setShowContractForm(false); load(); }}
        defaultEmployeeId={employee.id}
      />
    </div>
  );
}
