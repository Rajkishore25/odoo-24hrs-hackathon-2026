import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  description?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, variant = 'default', description, className }: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    critical: 'border-critical/30 bg-critical-muted',
    warning: 'border-warning/30 bg-warning-muted',
    success: 'border-success/30 bg-success-muted',
    info: 'border-info/30 bg-info-muted',
  };

  const iconStyles = {
    default: 'text-primary bg-primary/10',
    critical: 'text-critical bg-critical/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
    info: 'text-info bg-info/10',
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconStyles[variant])}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
