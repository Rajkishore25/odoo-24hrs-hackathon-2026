/**
 * Returns the number of working days between two dates (inclusive)
 * based on a list of working day names like ["MON","TUE","WED","THU","FRI"].
 */
export function countWorkingDays(
  start: Date,
  end: Date,
  workingDays: string[]
): number {
  const dayMap: Record<number, string> = {
    0: 'SUN',
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
  };

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayName = dayMap[current.getDay()];
    if (workingDays.includes(dayName)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Returns the number of calendar days between two dates (inclusive).
 */
export function countCalendarDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Returns true if two date ranges overlap.
 */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null
): boolean {
  const aEndOrMax = aEnd ?? new Date('9999-12-31');
  const bEndOrMax = bEnd ?? new Date('9999-12-31');
  return aStart <= bEndOrMax && aEndOrMax >= bStart;
}

/**
 * Clamps a date range to the intersection of two ranges.
 * Returns null if no intersection.
 */
export function intersectDateRanges(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null
): { start: Date; end: Date } | null {
  const aEndOrMax = aEnd ?? new Date('9999-12-31');
  const bEndOrMax = bEnd ?? new Date('9999-12-31');

  const start = aStart > bStart ? aStart : bStart;
  const end = aEndOrMax < bEndOrMax ? aEndOrMax : bEndOrMax;

  if (start > end) return null;
  return { start, end };
}

/**
 * Format a date as YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
