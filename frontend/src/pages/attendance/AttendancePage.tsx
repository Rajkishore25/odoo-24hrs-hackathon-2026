import { useEffect, useState, useCallback } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { attendanceApi } from '@/api/attendance';
import { employeesApi } from '@/api/employees';
import { Attendance, AttendanceException, Employee } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PRESENT: 'text-success',
  ABSENT: 'text-critical',
  LATE: 'text-warning',
  EARLY_DEPARTURE: 'text-warning',
  MISSING_PUNCH: 'text-critical',
};

export function AttendancePage() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const employeeId = user?.employee?.id;

  const [records, setRecords] = useState<Attendance[]>([]);
  const [exceptions, setExceptions] = useState<AttendanceException[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState(isEmployee && employeeId ? employeeId : '');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [reviewException, setReviewException] = useState<AttendanceException | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterEmployee) params.employeeId = filterEmployee;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const [recRes, excRes] = await Promise.all([
        attendanceApi.list(params),
        attendanceApi.listExceptions(filterEmployee ? { employeeId: filterEmployee } : {}),
      ]);
      setRecords(recRes.data.data.items);
      setExceptions(excRes.data.data.items);
    } catch (err) {
      toast.error('Failed to load attendance', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterFrom, filterTo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isEmployee) {
      employeesApi.list({ status: 'ACTIVE', limit: '100' })
        .then((res) => setEmployees(res.data.data.items))
        .catch(console.error);
    }
  }, [isEmployee]);

  async function handleCheckIn() {
    if (!employeeId) return;
    setCheckingIn(true);
    try {
      await attendanceApi.checkIn(employeeId);
      toast.success('Checked in successfully');
      load();
    } catch (err) {
      toast.error('Check-in failed', getApiError(err));
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleCheckOut() {
    if (!employeeId) return;
    setCheckingOut(true);
    try {
      await attendanceApi.checkOut(employeeId);
      toast.success('Checked out successfully');
      load();
    } catch (err) {
      toast.error('Check-out failed', getApiError(err));
    } finally {
      setCheckingOut(false);
    }
  }

  async function handleResolveException(status: 'REVIEWED' | 'CORRECTED' | 'DISMISSED') {
    if (!reviewException) return;
    try {
      await attendanceApi.updateException(reviewException.id, { status, reason: reviewReason });
      toast.success('Exception updated');
      setReviewException(null);
      setReviewReason('');
      load();
    } catch (err) {
      toast.error('Failed to update exception', getApiError(err));
    }
  }

  const openExceptionCount = exceptions.filter((e) => e.status === 'OPEN').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        description="Track and manage employee attendance"
        actions={
          isEmployee && (
            <div className="flex gap-2">
              <Button onClick={handleCheckIn} disabled={checkingIn} variant="success">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {checkingIn ? 'Checking in...' : 'Check In'}
              </Button>
              <Button onClick={handleCheckOut} disabled={checkingOut} variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                {checkingOut ? 'Checking out...' : 'Check Out'}
              </Button>
            </div>
          )
        }
      />

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="exceptions">
            Exceptions
            {openExceptionCount > 0 && (
              <span className="ml-2 rounded-full bg-warning text-warning-foreground text-xs px-1.5 py-0.5 font-semibold">
                {openExceptionCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-3">
          {/* Filters */}
          {!isEmployee && (
            <div className="flex gap-3 flex-wrap">
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All employees</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-44" placeholder="From" />
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-44" placeholder="To" />
            </div>
          )}

          {loading ? <LoadingState /> : records.length === 0 ? (
            <EmptyState icon={Clock} title="No attendance records" description="No records found for the selected filters." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Employee', 'Date', 'Check In', 'Check Out', 'Worked Hours', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => (
                      <tr key={rec.id} className={cn(
                        'border-b border-border last:border-0',
                        rec.hasException && 'bg-warning-muted/30'
                      )}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{rec.employee?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{rec.employee?.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3">{formatDate(rec.date)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium">{Number(rec.workedHours).toFixed(1)}h</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-semibold', statusColors[rec.status] ?? 'text-muted-foreground')}>
                            {rec.status.replace('_', ' ')}
                          </span>
                          {rec.hasException && (
                            <AlertTriangle className="inline ml-1 h-3 w-3 text-warning" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-3">
          {loading ? <LoadingState /> : exceptions.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No exceptions" description="All attendance records are clean." />
          ) : (
            <div className="space-y-2">
              {exceptions.map((exc) => (
                <Card key={exc.id} className={exc.status === 'OPEN' ? 'border-warning/30' : ''}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {exc.type.replace('_', ' ')} — Exception
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exc.reason ?? 'No reason provided'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={exc.status === 'OPEN' ? 'warning' : exc.status === 'DISMISSED' ? 'archived' : 'success'}>
                        {exc.status}
                      </Badge>
                      {exc.status === 'OPEN' && (
                        <Button size="sm" variant="outline" onClick={() => setReviewException(exc)}>
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review exception dialog */}
      <Dialog open={!!reviewException} onOpenChange={(o) => !o && setReviewException(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Exception</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Type: {reviewException?.type?.replace('_', ' ')}</p>
            <div className="space-y-1.5">
              <Label>Reason / Notes</Label>
              <Input value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} placeholder="Add a reason..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => handleResolveException('DISMISSED')}>Dismiss</Button>
            <Button variant="warning" size="sm" onClick={() => handleResolveException('REVIEWED')}>Mark Reviewed</Button>
            <Button variant="success" size="sm" onClick={() => handleResolveException('CORRECTED')}>Mark Corrected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
