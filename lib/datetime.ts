import { format, parseISO, formatInTimeZone } from 'date-fns-tz';
import { addDays, differenceInDays, parse } from 'date-fns';

/**
 * Get current date/time in a specific timezone
 */
export function nowInTimezone(timezone: string): Date {
  return new Date(formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Get current date (YYYY-MM-DD) in timezone
 */
export function todayInTimezone(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}

/**
 * Convert UTC timestamp to timezone date string
 */
export function utcToTimezoneDate(utcTimestamp: string, timezone: string): string {
  return formatInTimeZone(parseISO(utcTimestamp), timezone, 'yyyy-MM-dd');
}

/**
 * Convert UTC timestamp to timezone datetime string
 */
export function utcToTimezoneDateTime(utcTimestamp: string, timezone: string): string {
  return formatInTimeZone(parseISO(utcTimestamp), timezone, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Check if today matches run_days (Mon,Tue,Wed format)
 */
export function shouldRunToday(runDays: string, timezone: string): boolean {
  const today = formatInTimeZone(new Date(), timezone, 'EEE'); // Mon, Tue, etc
  const days = runDays.split(',').map(d => d.trim());
  return days.includes(today);
}

/**
 * Check if current time is past scheduled time (HH:MM)
 */
export function isPastScheduledTime(scheduledTime: string, timezone: string): boolean {
  const now = formatInTimeZone(new Date(), timezone, 'HH:mm');
  return now >= scheduledTime;
}

/**
 * Calculate days until expiry
 */
export function daysToExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = parseISO(expiryDate);
  return differenceInDays(expiry, today);
}

/**
 * Parse run_days string to array
 */
export function parseRunDays(runDays: string): string[] {
  return runDays.split(',').map(d => d.trim());
}

/**
 * Get day of week from date
 */
export function getDayOfWeek(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'EEE');
}
