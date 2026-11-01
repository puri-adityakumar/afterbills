import type { PlanningWindow } from "@/contracts/model";

const DAY_MS = 86_400_000;

export function isValidDate(input: string): boolean {
  if (typeof input !== "string" || input.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const [year, month, day] = input.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function dateOrdinal(input: string): number {
  if (!isValidDate(input)) throw new Error("Invalid calendar date");
  const [year, month, day] = input.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime() / DAY_MS;
}

export function addDays(date: string, days: number): string {
  if (!Number.isSafeInteger(days)) throw new Error("Days must be a safe integer");
  const ordinal = dateOrdinal(date) + days;
  if (ordinal < dateOrdinal("0001-01-01") || ordinal > dateOrdinal("9999-12-31")) {
    throw new Error("Date is outside the supported calendar range");
  }
  return new Date(ordinal * DAY_MS).toISOString().slice(0, 10);
}

export function assertTimezone(timezone: string): void {
  if (typeof timezone !== "string" || timezone.length === 0 || /^[+-]/.test(timezone)) {
    throw new Error("Use an IANA timezone");
  }
  // Construction validates the timezone without consulting a clock.
  new Intl.DateTimeFormat("en-US", { timeZone: timezone });
}

export function todayInTimezone(timezone: string, now: Date): string {
  assertTimezone(timezone);
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error("Invalid current date");
  const parts = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", era: "short",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value;
  const date = `${part("year")?.padStart(4, "0")}-${part("month")}-${part("day")}`;
  if (part("era") !== "AD" || !isValidDate(date)) throw new Error("Date is outside the supported calendar range");
  return date;
}

export function createWindow(timezone: string, now: Date): PlanningWindow {
  const startDate = todayInTimezone(timezone, now);
  return { startDate, endDateExclusive: addDays(startDate, 14), timezone, dayCount: 14 };
}

export function validateWindow(window: PlanningWindow): void {
  if (!window || window.dayCount !== 14 || addDays(window.startDate, 14) !== window.endDateExclusive) {
    throw new Error("Planning window must contain exactly 14 calendar dates");
  }
  assertTimezone(window.timezone);
}
