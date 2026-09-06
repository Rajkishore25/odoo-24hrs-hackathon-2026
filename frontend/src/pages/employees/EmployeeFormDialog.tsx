import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineLoader } from '@/components/ui/loading-state';
import { authApi } from '@/api/auth';
import { employeesApi } from '@/api/employees';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { Employee } from '@/types';

// ── Designation options ──────────────────────────────────────────────────────
const DESIGNATIONS = [
  'Software Developer',
  'Senior Software Developer',
  'Lead Developer',
  'Engineering Manager',
  'HR Specialist',
  'HR Executive',
  'Payroll Executive',
  'Finance Analyst',
  'Accountant',
  'Operations Manager',
  'Business Analyst',
  'Project Manager',
  'Team Lead',
  'Intern',
  'Trainee',
  'Administrative Officer',
  'Other',
];

const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Operations',
  'Marketing',
  'Sales',
  'Administration',
  'Legal',
  'IT Support',
  'Other',
];

// ── Schemas ──────────────────────────────────────────────────────────────────
const createSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  role: z.enum(['HR_MANAGER', 'EMPLOYEE']),
  employeeCode: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().min(1, 'Required'),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().min(1, 'Required'),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee;
  defaultEmployeeId?: string;
}

export function EmployeeFormDialog({ open, onClose, onSuccess, employee }: Props) {
  const { user } = useAuth();
  const isEdit = !!employee;
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [showPassword, setShowPassword] = useState(false);

  // ── Create form ────────────────────────────────────────────────────────────
  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'EMPLOYEE' },
  });

  // ── Edit form ──────────────────────────────────────────────────────────────
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: employee ? {
      name: employee.name,
      phone: employee.phone ?? '',
      department: employee.department ?? '',
      designation: employee.designation ?? '',
      joiningDate: employee.joiningDate?.split('T')[0] ?? '',
      bankAccountNumber: employee.bankAccountNumber ?? '',
      bankName: employee.bankName ?? '',
    } : {},
  });

  useEffect(() => {
    if (!open) {
      createForm.reset({ role: 'EMPLOYEE' });
      editForm.reset();
    }
  }, [open]);

  // ── Submit create ──────────────────────────────────────────────────────────
  async function onCreateSubmit(values: CreateValues) {
    try {
      await authApi.createAccount(values);
      toast.success(`Account created for ${values.name}`, `Login: ${values.email}`);
      onSuccess();
    } catch (err) {
      toast.error('Failed to create account', getApiError(err));
    }
  }

  // ── Submit edit ────────────────────────────────────────────────────────────
  async function onEditSubmit(values: EditValues) {
    try {
      await employeesApi.update(employee!.id, values);
      toast.success('Employee updated');
      onSuccess();
    } catch (err) {
      toast.error('Failed to update employee', getApiError(err));
    }
  }

  // ── Edit form UI ───────────────────────────────────────────────────────────
  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee — {employee?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" required error={editForm.formState.errors.name?.message}>
                <Input {...editForm.register('name')} />
              </Field>
              <Field label="Phone" error={editForm.formState.errors.phone?.message}>
                <Input {...editForm.register('phone')} />
              </Field>

              {/* Department dropdown */}
              <Field label="Department">
                <Controller control={editForm.control} name="department" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>

              {/* Designation dropdown */}
              <Field label="Designation">
                <Controller control={editForm.control} name="designation" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>

              <Field label="Joining Date" required>
                <Input type="date" {...editForm.register('joiningDate')} />
              </Field>

              {isAdmin && (
                <Field label="Status">
                  <Controller control={editForm.control} name="status" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bank Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Account Number"><Input {...editForm.register('bankAccountNumber')} /></Field>
                <Field label="Bank Name"><Input {...editForm.register('bankName')} /></Field>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting && <InlineLoader className="mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Create form UI ─────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
        </DialogHeader>

        {/* Info note */}
        <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info-muted px-3 py-2.5">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p className="text-xs text-info">
            You are setting the login credentials. Share the email and password with the new user securely.
            They can change their password after logging in.
          </p>
        </div>

        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">

          {/* Account type — Admin sees both HR + Employee, HR sees Employee only */}
          {isAdmin && (
            <Field label="Account Type" required>
              <Controller control={createForm.control} name="role" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
          )}

          {/* Login credentials */}
          <div className="rounded-md border border-border p-4 space-y-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Login Credentials</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" required error={createForm.formState.errors.email?.message}>
                <Input type="email" placeholder="employee@company.com" {...createForm.register('email')} />
              </Field>
              <Field label="Initial Password" required error={createForm.formState.errors.password?.message}>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    {...createForm.register('password')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* Personal details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee Code" required error={createForm.formState.errors.employeeCode?.message}>
                <Input placeholder="EMP004" {...createForm.register('employeeCode')} />
              </Field>
              <Field label="Full Name" required error={createForm.formState.errors.name?.message}>
                <Input placeholder="Full name" {...createForm.register('name')} />
              </Field>
              <Field label="Phone">
                <Input placeholder="+91XXXXXXXXXX" {...createForm.register('phone')} />
              </Field>
              <Field label="Joining Date" required error={createForm.formState.errors.joiningDate?.message}>
                <Input type="date" {...createForm.register('joiningDate')} />
              </Field>

              {/* Department dropdown */}
              <Field label="Department">
                <Controller control={createForm.control} name="department" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>

              {/* Designation dropdown */}
              <Field label="Designation">
                <Controller control={createForm.control} name="designation" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>
            </div>
          </div>

          {/* Bank details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bank Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Account Number"><Input {...createForm.register('bankAccountNumber')} /></Field>
              <Field label="Bank Name"><Input {...createForm.register('bankName')} /></Field>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting && <InlineLoader className="mr-2" />}
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Small helper for consistent field layout
function Field({ label, required, error, children }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-critical ml-1">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-critical">{error}</p>}
    </div>
  );
}
