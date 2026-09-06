import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'Loading...', className, size = 'md' }: LoadingStateProps) {
  const iconSize = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size];
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <Loader2 className={cn('animate-spin text-primary', iconSize)} />
      <p className={cn('text-muted-foreground', textSize)}>{message}</p>
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}
