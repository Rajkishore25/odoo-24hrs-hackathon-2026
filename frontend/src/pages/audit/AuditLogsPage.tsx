import { useEffect, useState, useCallback } from 'react';
import { ScrollText, ChevronDown, ChevronRight } from 'lucide-react';
import { payrollApi } from '@/api/payroll';
import { AuditLog } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { cn } from '@/lib/utils';

const ACTION_COLOR: Record<string, string> = {
  EMPLOYEE_CREATED: 'text-success',
  EMPLOYEE_UPDATED: 'text-info',
  EMPLOYEE_ARCHIVED: 'text-warning',
  CONTRACT_CREATED: 'text-success',
  CONTRACT_UPDATED: 'text-info',
  SALARY_STRUCTURE_CREATED: 'text-success',
  SALARY_RULE_CREATED: 'text-success',
  SALARY_RULE_UPDATED: 'text-info',
  LEAVE_APPROVED: 'text-success',
  LEAVE_REJECTED: 'text-critical',
  PAYRUN_CREATED: 'text-info',
  PAYRUN_COMPUTED: 'text-info',
  PAYRUN_FINALIZED: 'text-success',
};

const ENTITY_TYPES = [
  '', 'Employee', 'Contract', 'SalaryStructure', 'SalaryRule',
  'TimeOffRequest', 'Payrun', 'Payslip',
];

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterAction) params.action = filterAction;
      if (filterEntity) params.entityType = filterEntity;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const res = await payrollApi.listAuditLogs(params);
      setLogs(res.data.data.items);
    } catch (err) {
      toast.error('Failed to load audit logs', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterEntity, filterFrom, filterTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Logs"
        description="Track all sensitive operations and changes"
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Filter by action..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-52"
        />
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((e) => (
              <SelectItem key={e} value={e}>{e || 'All entities'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-44" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-44" />
      </div>

      {loading ? <LoadingState /> : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit records" description="No events match the current filters." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['When', 'User', 'Action', 'Entity', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className={cn(
                        'border-b border-border last:border-0 transition-colors',
                        (log.oldData || log.newData) ? 'cursor-pointer hover:bg-accent/50' : ''
                      )}
                      onClick={() => (log.oldData || log.newData) && setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium text-foreground">{log.user?.email?.split('@')[0] ?? '—'}</p>
                        <p className="text-muted-foreground">{log.user?.role?.replace('_', ' ')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold', ACTION_COLOR[log.action] ?? 'text-foreground')}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <p>{log.entityType}</p>
                        {log.entityId && (
                          <p className="font-mono text-xs opacity-60">{log.entityId.slice(0, 8)}...</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(log.oldData || log.newData) ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {expanded === log.id
                              ? <ChevronDown className="h-3 w-3" />
                              : <ChevronRight className="h-3 w-3" />
                            }
                            <span>View changes</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{log.reason ?? '—'}</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded change diff */}
                    {expanded === log.id && (log.oldData || log.newData) && (
                      <tr key={`${log.id}-expanded`} className="border-b border-border bg-muted/30">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-2 gap-4">
                            {log.oldData && (
                              <div>
                                <p className="text-xs font-semibold text-critical mb-1">Before</p>
                                <pre className="text-xs text-muted-foreground bg-background border border-border rounded p-2 overflow-auto max-h-40 scrollbar-thin">
                                  {JSON.stringify(log.oldData, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newData && (
                              <div>
                                <p className="text-xs font-semibold text-success mb-1">After</p>
                                <pre className="text-xs text-muted-foreground bg-background border border-border rounded p-2 overflow-auto max-h-40 scrollbar-thin">
                                  {JSON.stringify(log.newData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                          {log.reason && (
                            <p className="text-xs text-muted-foreground mt-2">Reason: {log.reason}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
