import type { FrequencyType } from '@/lib/types/lifeplan';

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get ISO week number for a date
 * Week 1 is the week containing Jan 4th
 */
export function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  // January 4 is always in week 1
  const week1 = new Date(d.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from there
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
}

/**
 * Get ISO week year (may differ from calendar year at year boundaries)
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return d.getFullYear();
}

/**
 * Get week key in format YYYY-Www (ISO week)
 * e.g., 2025-W04 for the 4th week of 2025
 */
export function getWeekKey(date: Date): string {
  const weekYear = getISOWeekYear(date);
  const weekNum = getISOWeek(date);
  return `${weekYear}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Get month key in format YYYY-MM
 * e.g., 2025-01 for January 2025
 */
export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get period key for a given frequency type and date
 * - DAILY: YYYY-MM-DD
 * - WEEKLY: YYYY-Www
 * - MONTHLY: YYYY-MM
 * - ONCE: 'ONCE'
 */
export function getPeriodKey(frequencyType: FrequencyType, date: Date): string {
  switch (frequencyType) {
    case 'DAILY':
      return formatDate(date);
    case 'WEEKLY':
      return getWeekKey(date);
    case 'MONTHLY':
      return getMonthKey(date);
    case 'ONCE':
      return 'ONCE';
    default:
      return formatDate(date);
  }
}

/**
 * Parse a date string as local time (avoids timezone issues)
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get start of week (Monday) for a given date
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Sunday) for a given date
 */
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/**
 * Get start of month for a given date
 */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month for a given date
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get week key from a date string (YYYY-MM-DD)
 */
export function getWeekKeyFromDateString(dateStr: string): string {
  return getWeekKey(parseLocalDate(dateStr));
}

/**
 * Get month key from a date string (YYYY-MM-DD)
 */
export function getMonthKeyFromDateString(dateStr: string): string {
  return getMonthKey(parseLocalDate(dateStr));
}
