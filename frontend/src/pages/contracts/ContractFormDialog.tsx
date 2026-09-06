import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineLoader } from '@/components/ui/loading-state';
import { contractsApi } from '@/api/contracts';
import { salaryApi } from '@/api/salary';
import { schedulesApi } from '@/api/schedules';
import { SalaryStructure, WorkingSchedule } from '@/types';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';

const schema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  wage: z.coerce.number().positive('Must be positive'),
  salaryStructureId: z.string().uuid('Required'),
  workingScheduleId: z.string().uuid('Required'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultEmployeeId?: string;
}

export function ContractFormDialog({ open, onClose, onSuccess, defaultEmployeeId }: Props) {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: defaultEmployeeId ?? '' },
  });

  useEffect(() => {
    if (!open) { reset({ employeeId: defaultEmployeeId ?? '' }); return; }
    Promise.all([salaryApi.listStructures(), schedulesApi.list()])
      .then(([sRes, schRes]) => {
        setStructures(sRes.data.data);
        setSchedules(schRes.data.data);
      })
      .catch(console.error);
  }, [open, defaultEmployeeId, reset]);

  useEffect(() => {
    if (defaultEmployeeId) setValue('employeeId', defaultEmployeeId);
  }, [defaultEmployeeId, setValue]);

  async function onSubmit(values: FormValues) {
    try {
      await contractsApi.create({ ...values, endDate: values.endDate || null });
      toast.success('Contract created');
      onSuccess();
    } catch (err) {
      toast.error('Failed to create contract', getApiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Contract</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('employeeId')} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date <span className="text-critical">*</span></Label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-critical">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register('endDate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Monthly Wage (₹) <span className="text-critical">*</span></Label>
            <Input type="number" step="0.01" {...register('wage')} placeholder="50000" />
            {errors.wage && <p className="text-xs text-critical">{errors.wage.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Salary Structure <span className="text-critical">*</span></Label>
            <Select onValueChange={(v) => setValue('salaryStructureId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select salary structure" />
              </SelectTrigger>
              <SelectContent>
                {structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.salaryStructureId && <p className="text-xs text-critical">{errors.salaryStructureId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Working Schedule <span className="text-critical">*</span></Label>
            <Select onValueChange={(v) => setValue('workingScheduleId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.workingScheduleId && <p className="text-xs text-critical">{errors.workingScheduleId.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <InlineLoader className="mr-2" />}
              Create Contract
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
