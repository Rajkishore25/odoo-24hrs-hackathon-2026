import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        critical: 'border-critical/30 bg-critical-muted text-critical',
        warning: 'border-warning/30 bg-warning-muted text-warning',
        success: 'border-success/30 bg-success-muted text-success',
        info: 'border-info/30 bg-info-muted text-info',
        // Payrun statuses
        draft: 'border-border bg-muted text-muted-foreground',
        in_progress: 'border-info/30 bg-info-muted text-info',
        validated: 'border-success/30 bg-success-muted text-success',
        finalized: 'border-primary/30 bg-primary/10 text-primary',
        paid: 'border-success/30 bg-success-muted text-success',
        // Employee statuses
        active: 'border-success/30 bg-success-muted text-success',
        inactive: 'border-warning/30 bg-warning-muted text-warning',
        archived: 'border-border bg-muted text-muted-foreground',
        // Leave statuses
        submitted: 'border-info/30 bg-info-muted text-info',
        approved: 'border-success/30 bg-success-muted text-success',
        rejected: 'border-critical/30 bg-critical-muted text-critical',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
