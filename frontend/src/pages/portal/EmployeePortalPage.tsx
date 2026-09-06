import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Umbrella, Receipt, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { attendanceApi } from '@/api/attendance';
import { timeoffApi } from '@/api/timeoff';
import { payrollApi } from '@/api/payroll';
import { useAuth } from '@/context/AuthContext';
import { Attendance, TimeOffRequest, Payslip } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';

const reqStatusVariant: Record<string, 'submitted' | 'approved' | 'rejected' | 'draft'> = {
  SUBMITTED: 'submitted', APPROVED: 'approved', REJECTED: 'rejected', DRAFT: 'draft',
};

export function EmployeePortalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const employeeId = user?.employee?.id;

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<TimeOffRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<Array<{ type: { name: string; isPaid: boolean }; allocated: number; used: number; remaining: number }>>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Check-in/out state
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Leave request dialog
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [reqTypeId, setReqTypeId] = useState('');
  const [reqStart, setReqStart] = useState('');
  const [reqEnd, setReqEnd] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  async function loadAll() {
    if (!employeeId) return;
    setLoading(true);
    try {
      const [attRes, leaveRes, balRes, payRes, typesRes] = await Promise.all([
        attendanceApi.list({ employeeId, limit: '10' }),
        timeoffApi.listRequests({ employeeId }),
        timeoffApi.getBalance(employeeId),
        payrollApi.listPayslipsForEmployee(employeeId),
        timeoffApi.listTypes(),
      ]);
      setAttendance(attRes.data.data.items);
      setLeaveRequests(leaveRes.data.data);
      setLeaveBalance(balRes.data.data);
      setPayslips(payRes.data.data);
      setLeaveTypes(typesRes.data.data);
    } catch (err) {
      toast.error('Failed to load portal data', getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [employeeId]);

  async function handleCheckIn() {
    if (!employeeId) return;
    setCheckingIn(true);
    try {
      await attendanceApi.checkIn(employeeId);
      toast.success('Checked in!');
      loadAll();
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
      toast.success('Checked out!');
      loadAll();
    } catch (err) {
      toast.error('Check-out failed', getApiError(err));
    } finally {
      setCheckingOut(false);
    }
  }

  async function submitLeave() {
    if (!employeeId || !reqTypeId || !reqStart || !reqEnd) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmittingLeave(true);
    try {
      await timeoffApi.createRequest({
        employeeId, timeOffTypeId: reqTypeId,
        startDate: reqStart, endDate: reqEnd, reason: reqReason,
      });
      toast.success('Leave request submitted');
      setShowLeaveForm(false);
      setReqTypeId(''); setReqStart(''); setReqEnd(''); setReqReason('');
      loadAll();
    } catch (err) {
      toast.error('Failed to submit leave', getApiError(err));
    } finally {
      setSubmittingLeave(false);
    }
  }

  async function downloadPayslip(payslipId: string) {
    try {
      const res = await payrollApi.downloadPdf(payslipId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('Download failed', getApiError(err));
    }
  }

  if (!employeeId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">Your account is not linked to an employee record.</p>
        <p className="text-xs text-muted-foreground">Please contact HR to link your account.</p>
      </div>
    );
  }

  if (loading) return <LoadingState message="Loading your portal..." />;

  // Today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find((a) => a.date.startsWith(today));

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Portal</h2>
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{user?.employee?.name ?? user?.email}</span>
          </p>
        </div>
        {/* Check in/out */}
        <div className="flex gap-2">
          <Button
            variant={todayRecord?.checkIn && !todayRecord?.checkOut ? 'outline' : 'success'}
            size="sm"
            onClick={handleCheckIn}
            disabled={checkingIn || !!(todayRecord?.checkIn)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {todayRecord?.checkIn ? 'Checked In' : 'Check In'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckOut}
            disabled={checkingOut || !todayRecord?.checkIn || !!(todayRecord?.checkOut)}
          >
            <Clock className="mr-2 h-4 w-4" />
            {todayRecord?.checkOut ? 'Checked Out' : 'Check Out'}
          </Button>
        </div>
      </div>

      {/* Today's status */}
      {todayRecord && (
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Check In</p>
              <p className="font-medium">
                {todayRecord.checkIn
                  ? new Date(todayRecord.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check Out</p>
              <p className="font-medium">
                {todayRecord.checkOut
                  ? new Date(todayRecord.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Worked</p>
              <p className="font-medium">{Number(todayRecord.workedHours).toFixed(1)}h</p>
            </div>
          </div>
          {todayRecord.hasException && (
            <div className="ml-auto flex items-center gap-2 text-xs text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span>Attendance exception pending</span>
            </div>
          )}
        </div>
      )}

      {/* Leave balance cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {leaveBalance.map(({ type, remaining, allocated }) => (
          <Card key={type.name}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{type.name}</p>
              <p className={`text-2xl font-bold mt-1 ${remaining > 0 ? 'text-success' : 'text-critical'}`}>
                {remaining}
              </p>
              <p className="text-xs text-muted-foreground">of {allocated} days remaining</p>
            </CardContent>
          </Card>
        ))}
        <Card
          className="border-dashed border-2 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setShowLeaveForm(true)}
        >
          <CardContent className="flex flex-col items-center justify-center p-4 h-full gap-1">
            <Umbrella className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Request Leave</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Recent Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          {attendance.length === 0 ? (
            <EmptyState icon={Clock} title="No attendance records" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Date', 'Check In', 'Check Out', 'Worked', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((rec) => (
                      <tr key={rec.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{formatDate(rec.date)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium">{Number(rec.workedHours).toFixed(1)}h</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${rec.status === 'PRESENT' ? 'text-success' : rec.status === 'ABSENT' ? 'text-critical' : 'text-warning'}`}>
                            {rec.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leave">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setShowLeaveForm(true)}>
              <Umbrella className="mr-2 h-4 w-4" /> Request Leave
            </Button>
          </div>
          {leaveRequests.length === 0 ? (
            <EmptyState icon={Umbrella} title="No leave requests" />
          ) : (
            <div className="space-y-2">
              {leaveRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{req.timeOffType?.name ?? 'Leave'}</p>
                        <Badge variant={reqStatusVariant[req.status] ?? 'draft'}>{req.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)} · {Number(req.requestedDays)} day(s)
                      </p>
                      {req.rejectionReason && (
                        <p className="text-xs text-critical mt-0.5">Rejected: {req.rejectionReason}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payslips">
          {payslips.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payslips yet"
              description="Your payslips will appear here after payroll is finalized by HR."
            />
          ) : (
            <div className="space-y-2">
              {payslips.map((ps: any) => (
                <Card
                  key={ps.id}
                  className={ps.status === 'PAID' ? 'border-success/30' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        {/* Payrun name + period */}
                        <p className="text-sm font-semibold text-foreground truncate">
                          {ps.payrun?.name ?? 'Payslip'}
                        </p>
                        {ps.payrun && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(ps.payrun.periodStart)} – {formatDate(ps.payrun.periodEnd)}
                          </p>
                        )}

                        {/* Earnings breakdown summary */}
                        <div className="flex gap-4 text-xs mt-1">
                          <span className="text-muted-foreground">
                            Gross: <span className="font-medium text-foreground">{formatCurrency(ps.gross)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Deductions: <span className="font-medium text-warning">{formatCurrency(ps.totalDeductions)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Net: <span className="font-bold text-success">{formatCurrency(ps.net)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/payslips/${ps.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadPayslip(ps.id)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Leave request dialog */}
      <Dialog open={showLeaveForm} onOpenChange={(o) => !o && setShowLeaveForm(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Leave Type <span className="text-critical">*</span></Label>
              <Select value={reqTypeId} onValueChange={setReqTypeId}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start <span className="text-critical">*</span></Label>
                <Input type="date" value={reqStart} onChange={(e) => setReqStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End <span className="text-critical">*</span></Label>
                <Input type="date" value={reqEnd} onChange={(e) => setReqEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={reqReason} onChange={(e) => setReqReason(e.target.value)} placeholder="Optional..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
            <Button onClick={submitLeave} disabled={submittingLeave}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
