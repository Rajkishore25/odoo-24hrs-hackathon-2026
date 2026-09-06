/**
 * HRProfilePage
 * Shown only for HR_MANAGER role.
 * Displays leave balance, allows requesting leave, and changing password.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  UserCircle, Umbrella, Plus, Calendar,
  CheckCircle2, XCircle, Clock, Shield, KeyRound, Eye, EyeOff,
} from 'lucide-react';
import { timeoffApi } from '@/api/timeoff';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';

interface LeaveBalance {
  type: { id: string; name: string; isPaid: boolean };
  allocated: number;
  used: number;
  remaining: number;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reason?: string;
  status: string;
  rejectionReason?: string;
  timeOffType?: { name: string };
  approver?: { email: string };
  approvedAt?: string;
}

const statusVariant: Record<string, 'submitted' | 'approved' | 'rejected' | 'draft'> = {
  SUBMITTED: 'submitted', APPROVED: 'approved', REJECTED: 'rejected', DRAFT: 'draft',
};

export function HRProfilePage() {
  const { user } = useAuth();
  const employeeId = user?.employee?.id;

  const [balance, setBalance] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Form state
  const [typeId, setTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!employeeId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [balRes, reqRes, typesRes] = await Promise.all([
        timeoffApi.getBalance(employeeId),
        timeoffApi.listRequests({ employeeId }),
        timeoffApi.listTypes(),
      ]);
      setBalance(balRes.data.data);
      setRequests(reqRes.data.data);
      setTypes(typesRes.data.data);
    } catch (err) {
      toast.error('Failed to load profile data', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  async function submitRequest() {
    if (!employeeId || !typeId || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await timeoffApi.createRequest({
        employeeId,
        timeOffTypeId: typeId,
        startDate,
        endDate,
        reason,
      });
      toast.success('Leave request submitted to Super Admin');
      setShowLeaveForm(false);
      setTypeId(''); setStartDate(''); setEndDate(''); setReason('');
      load();
    } catch (err) {
      toast.error('Failed to submit request', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword() {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast.success('Password changed successfully');
      setShowPwForm(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to change password', getApiError(err));
    } finally {
      setChangingPw(false);
    }
  }

  if (loading) return <LoadingState message="Loading your profile..." />;

  const totalAllocated = balance.reduce((s, b) => s + b.allocated, 0);
  const totalUsed = balance.reduce((s, b) => s + b.used, 0);
  const totalRemaining = balance.reduce((s, b) => s + b.remaining, 0);
  const pendingCount = requests.filter((r) => r.status === 'SUBMITTED').length;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="My Profile"
        description="Your leave balance and requests"
        actions={
          <Button onClick={() => setShowLeaveForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Request Leave
          </Button>
        }
      />

      {/* Admin-only note */}
      <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
        <Shield className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm text-primary">
          Your leave requests are reviewed and approved exclusively by the <strong>Super Admin</strong>.
        </p>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold shrink-0">
            {(user?.employee?.name ?? user?.email ?? '?')[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">
              {user?.employee?.name ?? user?.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.employee?.department ?? 'HR Department'} · HR Manager
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Leave balance summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Allocated', value: totalAllocated, icon: Calendar, color: 'text-info' },
          { label: 'Used', value: totalUsed, icon: Clock, color: 'text-warning' },
          { label: 'Remaining', value: totalRemaining, icon: CheckCircle2, color: totalRemaining > 0 ? 'text-success' : 'text-critical' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance by leave type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Leave Balance by Type</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {balance.length === 0 ? (
            <EmptyState icon={Umbrella} title="No leave allocations" description="Contact Super Admin to allocate leave." className="py-8" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Leave Type', 'Allocated', 'Used', 'Remaining', 'Type'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balance.map(({ type, allocated, used, remaining }) => (
                  <tr key={type.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{type.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{allocated} days</td>
                    <td className="px-5 py-3 text-warning">{used} days</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${remaining > 0 ? 'text-success' : 'text-critical'}`}>
                        {remaining} days
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={type.isPaid ? 'success' : 'warning'} className="text-xs">
                        {type.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* My leave requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            My Leave Requests
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-warning text-warning-foreground text-xs px-2 py-0.5 font-semibold">
                {pendingCount} pending
              </span>
            )}
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowLeaveForm(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" /> New Request
          </Button>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={Umbrella}
            title="No leave requests yet"
            description="Submit a leave request — it will be reviewed by the Super Admin."
            action={<Button size="sm" onClick={() => setShowLeaveForm(true)}>Request Leave</Button>}
          />
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <Card
                key={req.id}
                className={
                  req.status === 'SUBMITTED' ? 'border-warning/30' :
                  req.status === 'APPROVED' ? 'border-success/30' :
                  req.status === 'REJECTED' ? 'border-critical/30' : ''
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{req.timeOffType?.name ?? 'Leave'}</p>
                        <Badge variant={statusVariant[req.status] ?? 'draft'}>{req.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)} · {Number(req.requestedDays)} day(s)
                      </p>
                      {req.reason && (
                        <p className="text-xs text-muted-foreground">Reason: "{req.reason}"</p>
                      )}
                      {req.status === 'APPROVED' && req.approver && (
                        <div className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved by {req.approver.email}
                          {req.approvedAt && ` on ${formatDate(req.approvedAt)}`}
                        </div>
                      )}
                      {req.status === 'REJECTED' && req.rejectionReason && (
                        <div className="flex items-center gap-1 text-xs text-critical">
                          <XCircle className="h-3 w-3" />
                          Rejected: {req.rejectionReason}
                        </div>
                      )}
                      {req.status === 'SUBMITTED' && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <Clock className="h-3 w-3" />
                          Awaiting Super Admin approval
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Request leave dialog */}
      <Dialog open={showLeaveForm} onOpenChange={(o) => !o && setShowLeaveForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-xs text-primary">This request will be sent to Super Admin for approval.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Leave Type <span className="text-critical">*</span></Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date <span className="text-critical">*</span></Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date <span className="text-critical">*</span></Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={submitting || !typeId || !startDate || !endDate}>
              {submitting ? 'Submitting...' : 'Submit to Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Password card ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
            </div>
            {!showPwForm && (
              <Button size="sm" variant="outline" onClick={() => setShowPwForm(true)}>
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        {showPwForm && (
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-muted px-3 py-2">
              <KeyRound className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">You can only change your own password. Enter your current password to confirm.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Current Password <span className="text-critical">*</span></Label>
              <div className="relative">
                <Input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOld((s) => !s)}>
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>New Password <span className="text-critical">*</span></Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew((s) => !s)}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Confirm New Password <span className="text-critical">*</span></Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-critical">Passwords do not match</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => {
                setShowPwForm(false);
                setOldPassword(''); setNewPassword(''); setConfirmPassword('');
              }}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={changingPw || !oldPassword || !newPassword || newPassword !== confirmPassword}
                onClick={handleChangePassword}
              >
                {changingPw ? 'Saving...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

    </div>
  );
}
