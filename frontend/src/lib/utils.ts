import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = '₹'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency}0.00`;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
