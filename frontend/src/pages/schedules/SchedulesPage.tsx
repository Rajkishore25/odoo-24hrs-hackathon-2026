import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, Pencil, Clock, Coffee } from 'lucide-react';
import { schedulesApi } from '@/api/schedules';
import { WorkingSchedule } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState, InlineLoader } from '@/components/ui/loading-state';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { cn } from '@/lib/utils';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const schema = z.object({
  name: z.string().min(1, 'Required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
  breakMinutes: z.coerce.number().min(0),
  workingDays: z.array(z.string()).min(1, 'Select at least one day'),
});

type FormValues = z.infer<typeof schema>;

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkingSchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkingSchedule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await schedulesApi.list();
      setSchedules(res.data.data);
    } catch (err) {
      toast.error('Failed to load schedules', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      startTime: '09:00', endTime: '18:00', breakMinutes: 60,
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    },
  });

  const selectedDays = watch('workingDays') ?? [];

  function openCreate() {
    setEditTarget(null);
    reset({ startTime: '09:00', endTime: '18:00', breakMinutes: 60, workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'], name: '' });
    setShowForm(true);
  }

  function openEdit(s: WorkingSchedule) {
    setEditTarget(s);
    reset({
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: s.breakMinutes,
      workingDays: s.workingDays as string[],
    });
    setShowForm(true);
  }

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setValue('workingDays', selectedDays.filter((d) => d !== day));
    } else {
      setValue('workingDays', [...selectedDays, day]);
    }
  };

  async function onSubmit(values: FormValues) {
    try {
      if (editTarget) {
        await schedulesApi.update(editTarget.id, values);
        toast.success('Schedule updated');
        if (selectedSchedule?.id === editTarget.id) {
          setSelectedSchedule({ ...editTarget, ...values });
        }
      } else {
        await schedulesApi.create(values);
        toast.success('Schedule created');
      }
      setShowForm(false);
      reset();
      load();
    } catch (err) {
      toast.error(`Failed to ${editTarget ? 'update' : 'create'} schedule`, getApiError(err));
    }
  }

  const netHours = (s: WorkingSchedule) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const gross = (eh * 60 + em) - (sh * 60 + sm);
    return ((gross - s.breakMinutes) / 60).toFixed(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Working Schedules"
        description="Configure employee working hours"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Schedule
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No schedules"
          description="Create a working schedule to assign to employee contracts."
          action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Schedule</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => (
            <Card
              key={s.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:border-primary/40',
                selectedSchedule?.id === s.id && 'border-primary ring-1 ring-primary/30'
              )}
              onClick={() => setSelectedSchedule(selectedSchedule?.id === s.id ? null : s)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{s.name}</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                    title="Edit schedule"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Hours row */}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Hours
                  </span>
                  <span className="font-medium">{s.startTime} – {s.endTime}</span>
                </div>

                {/* Break row */}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Coffee className="h-3.5 w-3.5" /> Break
                  </span>
                  <span className="font-medium">{s.breakMinutes} min</span>
                </div>

                {/* Net hours */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Net hours/day</span>
                  <span className="font-semibold text-primary">{netHours(s)}h</span>
                </div>

                <Separator />

                {/* Working days */}
                <div className="flex gap-1 flex-wrap">
                  {DAYS.map((day) => (
                    <Badge
                      key={day}
                      variant={(s.workingDays as string[]).includes(day) ? 'active' : 'draft'}
                      className="text-xs px-2 py-0.5"
                    >
                      {day}
                    </Badge>
                  ))}
                </div>

                {/* Expanded detail on click */}
                {selectedSchedule?.id === s.id && (
                  <div className="pt-2 border-t border-border space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-muted p-2">
                        <p className="text-muted-foreground">Working days/week</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {(s.workingDays as string[]).length} days
                        </p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <p className="text-muted-foreground">Hours/week</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {(Number(netHours(s)) * (s.workingDays as string[]).length).toFixed(1)}h
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-1"
                      onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Schedule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); reset(); setEditTarget(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Edit — ${editTarget.name}` : 'New Working Schedule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Schedule Name <span className="text-critical">*</span></Label>
              <Input {...register('name')} placeholder="Standard 9 to 6" />
              {errors.name && <p className="text-xs text-critical">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" {...register('startTime')} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" {...register('endTime')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Break Duration (minutes)</Label>
              <Input type="number" {...register('breakMinutes')} />
            </div>

            <div className="space-y-2">
              <Label>Working Days <span className="text-critical">*</span></Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                      selectedDays.includes(day)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors.workingDays && <p className="text-xs text-critical">{errors.workingDays.message}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); reset(); setEditTarget(null); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <InlineLoader className="mr-2" />}
                {editTarget ? 'Save Changes' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
