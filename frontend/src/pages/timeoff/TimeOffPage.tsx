import { useEffect, useState, useCallback } from 'react';
import { Umbrella, Plus, Check, X, Shield } from 'lucide-react';
import { timeoffApi } from '@/api/timeoff';
import { TimeOffType, TimeOffRequest, TimeOffAllocation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';

const reqStatusVariant: Record<string, 'submitted' | 'approved' | 'rejected' | 'draft'> = {
  SUBMITTED: 'submitted', APPROVED: 'approved', REJECTED: 'rejected', DRAFT: 'draft',
};

export function TimeOffPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const employeeId = user?.employee?.id;
  // Line managers and HR can approve regular leave; admin approves HR leave too
  const canApprove = ['HR_MANAGER', 'LINE_MANAGER', 'SUPER_ADMIN'].includes(user?.role ?? '');

  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [hrRequests, setHrRequests] = useState<TimeOffRequest[]>([]); // only for SUPER_ADMIN
  const [balance, setBalance] = useState<Array<{ type: TimeOffType; allocated: number; used: number; remaining: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // New request form state
  const [reqTypeId, setReqTypeId] = useState('');
  const [reqStart, setReqStart] = useState('');
  const [reqEnd, setReqEnd] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, rRes] = await Promise.all([
        timeoffApi.listTypes(),
        isEmployee && employeeId
          ? timeoffApi.listRequests({ employeeId })
          : timeoffApi.listRequests({}),
      ]);
      setTypes(typesRes.data.data);

      // Backend already filters HR leave from non-admins via requesterRole
      // For SUPER_ADMIN: separate HR requests into their own tab
      if (isAdmin) {
        const all: TimeOffRequest[] = rRes.data.data;
        const hrReqs = all.filter((r: any) => r.employee?.user?.role === 'HR_MANAGER');
        const nonHrReqs = all.filter((r: any) => r.employee?.user?.role !== 'HR_MANAGER');
        setHrRequests(hrReqs);
        setRequests(nonHrReqs);
      } else {
        setRequests(rRes.data.data);
      }

      if (isEmployee && employeeId) {
        const balRes = await timeoffApi.getBalance(employeeId);
        setBalance(balRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load time off data', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [isEmployee, isAdmin, employeeId]);

  useEffect(() => { load(); }, [load]);

  async function submitRequest() {
    if (!employeeId || !reqTypeId || !reqStart || !reqEnd) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await timeoffApi.createRequest({
        employeeId, timeOffTypeId: reqTypeId,
        startDate: reqStart, endDate: reqEnd, reason: reqReason,
      });
      toast.success('Leave request submitted');
      setShowRequestForm(false);
      setReqTypeId(''); setReqStart(''); setReqEnd(''); setReqReason('');
      load();
    } catch (err) {
      toast.error('Failed to submit request', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function approveRequest(id: string) {
    try {
      await timeoffApi.approveRequest(id);
      toast.success('Leave request approved');
      load();
    } catch (err) {
      toast.error('Failed to approve', getApiError(err));
    }
  }

  async function rejectRequest() {
    if (!rejectDialog) return;
    try {
      await timeoffApi.rejectRequest(rejectDialog.id, rejectReason);
      toast.success('Leave request rejected');
      setRejectDialog(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error('Failed to reject', getApiError(err));
    }
  }

  const pendingCount = requests.filter((r) => r.status === 'SUBMITTED').length;
  const hrPendingCount = hrRequests.filter((r) => r.status === 'SUBMITTED').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Time Off"
        description="Manage leave requests and balances"
        actions={
          isEmployee && (
            <Button onClick={() => setShowRequestForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Request Leave
            </Button>
          )
        }
      />

      <Tabs defaultValue={isEmployee ? 'my-requests' : 'pending'}>
        <TabsList>
          {isEmployee && <TabsTrigger value="my-requests">My Requests</TabsTrigger>}
          {isEmployee && <TabsTrigger value="balance">My Balance</TabsTrigger>}
          {canApprove && (
            <TabsTrigger value="pending">
              Pending
              {pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-warning text-warning-foreground text-xs px-1.5 py-0.5 font-semibold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
          {canApprove && <TabsTrigger value="all">All Requests</TabsTrigger>}
          {/* SUPER_ADMIN only — HR Manager leave requests */}
          {isAdmin && (
            <TabsTrigger value="hr-leave">
              HR Leave
              {hrPendingCount > 0 && (
                <span className="ml-2 rounded-full bg-critical text-critical-foreground text-xs px-1.5 py-0.5 font-semibold">
                  {hrPendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Employee: My Requests */}
        {isEmployee && (
          <TabsContent value="my-requests" className="space-y-3">
            {loading ? <LoadingState /> : requests.length === 0 ? (
              <EmptyState icon={Umbrella} title="No leave requests" description="Submit a leave request to get started." />
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Employee: Balance */}
        {isEmployee && (
          <TabsContent value="balance">
            {loading ? <LoadingState /> : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {balance.map(({ type, allocated, used, remaining }) => (
                  <Card key={type.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{type.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Allocated</span>
                        <span>{allocated} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Used</span>
                        <span className="text-warning">{used} days</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                        <span>Remaining</span>
                        <span className={remaining > 0 ? 'text-success' : 'text-critical'}>{remaining} days</span>
                      </div>
                      <Badge variant={type.isPaid ? 'success' : 'warning'} className="text-xs">
                        {type.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Manager: Pending */}
        {canApprove && (
          <TabsContent value="pending" className="space-y-3">
            {loading ? <LoadingState /> : requests.filter((r) => r.status === 'SUBMITTED').length === 0 ? (
              <EmptyState icon={Check} title="No pending requests" description="All leave requests have been processed." />
            ) : (
              <div className="space-y-2">
                {requests.filter((r) => r.status === 'SUBMITTED').map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={() => approveRequest(req.id)}
                    onReject={() => setRejectDialog({ id: req.id })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Manager: All */}
        {canApprove && (
          <TabsContent value="all" className="space-y-3">
            {loading ? <LoadingState /> : requests.length === 0 ? (
              <EmptyState icon={Umbrella} title="No requests" />
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={req.status === 'SUBMITTED' ? () => approveRequest(req.id) : undefined}
                    onReject={req.status === 'SUBMITTED' ? () => setRejectDialog({ id: req.id }) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* SUPER_ADMIN only: HR Manager leave requests */}
        {isAdmin && (
          <TabsContent value="hr-leave" className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-2.5 mb-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-primary font-medium">
                These leave requests are from HR Managers. Only you (Super Admin) can approve or reject them.
              </p>
            </div>
            {loading ? <LoadingState /> : hrRequests.length === 0 ? (
              <EmptyState icon={Umbrella} title="No HR leave requests" description="No HR Managers have submitted leave requests." />
            ) : (
              <div className="space-y-2">
                {hrRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={req.status === 'SUBMITTED' ? () => approveRequest(req.id) : undefined}
                    onReject={req.status === 'SUBMITTED' ? () => setRejectDialog({ id: req.id }) : undefined}
                    isHrLeave
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={showRequestForm} onOpenChange={(o) => !o && setShowRequestForm(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Leave Type <span className="text-critical">*</span></Label>
              <Select value={reqTypeId} onValueChange={setReqTypeId}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date <span className="text-critical">*</span></Label>
                <Input type="date" value={reqStart} onChange={(e) => setReqStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date <span className="text-critical">*</span></Label>
                <Input type="date" value={reqEnd} onChange={(e) => setReqEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={reqReason} onChange={(e) => setReqReason(e.target.value)} placeholder="Optional reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestForm(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={submitting}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(o) => !o && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="critical" onClick={rejectRequest}>Reject Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestCard({
  request, onApprove, onReject, isHrLeave,
}: {
  request: TimeOffRequest;
  onApprove?: () => void;
  onReject?: () => void;
  isHrLeave?: boolean;
}) {
  const reqStatusVariant: Record<string, 'submitted' | 'approved' | 'rejected' | 'draft'> = {
    SUBMITTED: 'submitted', APPROVED: 'approved', REJECTED: 'rejected', DRAFT: 'draft',
  };

  return (
    <Card className={`${request.status === 'SUBMITTED' ? (isHrLeave ? 'border-primary/30' : 'border-info/30') : ''}`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">
              {request.employee?.name ?? 'Employee'} · {request.timeOffType?.name ?? 'Leave'}
            </p>
            {isHrLeave && (
              <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold border border-primary/20 bg-primary/5 rounded-full px-2 py-0.5">
                <Shield className="h-3 w-3" /> HR Manager
              </span>
            )}
            <Badge variant={reqStatusVariant[request.status] ?? 'draft'}>{request.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(request.startDate)} – {formatDate(request.endDate)} · {Number(request.requestedDays)} day(s)
          </p>
          {request.reason && <p className="text-xs text-muted-foreground">"{request.reason}"</p>}
          {request.rejectionReason && (
            <p className="text-xs text-critical">Rejected: {request.rejectionReason}</p>
          )}
        </div>
        {(onApprove || onReject) && (
          <div className="flex gap-2">
            {onApprove && (
              <Button size="sm" variant="success" onClick={onApprove}>
                <Check className="h-4 w-4" />
              </Button>
            )}
            {onReject && (
              <Button size="sm" variant="critical" onClick={onReject}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
