import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserX } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { EmployeeFormDialog } from './EmployeeFormDialog';

export function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await employeesApi.list(params);
      setEmployees(res.data.data.items);
    } catch (err) {
      toast.error('Failed to load employees', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const statusBadge = (status: string) => {
    const map: Record<string, 'active' | 'inactive' | 'archived'> = {
      ACTIVE: 'active', INACTIVE: 'inactive', ARCHIVED: 'archived',
    };
    return <Badge variant={map[status] ?? 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employees"
        description="Manage your workforce"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No employees found"
          description="Add your first employee to get started."
          action={<Button onClick={() => setShowForm(true)}>Add Employee</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Code', 'Name', 'Department', 'Designation', 'Joined', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{emp.employeeCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.department ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.designation ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(emp.joiningDate)}</td>
                    <td className="px-4 py-3">{statusBadge(emp.status)}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <EmployeeFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); load(); }}
      />
    </div>
  );
}
