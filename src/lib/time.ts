import { format, parseISO } from "date-fns";
import { toZonedTime, format as formatZoned } from "date-fns-tz";

/**
 * Get current date string (YYYY-MM-DD) in a specific timezone
 */
export function getLocalDateString(date: Date = new Date(), timezone: string = "UTC"): string {
  try {
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, "yyyy-MM-dd");
  } catch {
    return date.toISOString().split("T")[0];
  }
}

/**
 * Format a UTC Date into local timezone formatted string
 */
export function formatInUserTimezone(
  date: Date | string | null | undefined,
  pattern: string = "yyyy-MM-dd HH:mm:ss",
  timezone: string = "UTC"
): string {
  if (!date) return "--";
  const d = typeof date === "string" ? parseISO(date) : date;
  try {
    const zoned = toZonedTime(d, timezone);
    return format(zoned, pattern);
  } catch {
    return format(d, pattern);
  }
}

/**
 * Format seconds into human readable duration (e.g. "8h 15m" or "45m" or "02:15:30")
 */
export function formatDurationHuman(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0 && m === 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/**
 * Format seconds into HH:MM:SS format for digital timers
 */
export function formatDurationTimer(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Calculate net work seconds: Total duration - Break duration
 */
export function calculateNetWorkDuration(totalSeconds: number, breakSeconds: number): number {
  return Math.max(0, totalSeconds - breakSeconds);
}

/**
 * Calculate duration in seconds between two dates
 */
export function diffInSeconds(start: Date, end: Date = new Date()): number {
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
  return Math.max(0, diff);
}
