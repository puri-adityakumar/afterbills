import { ASSET, SAMPLE_PROFILE_KEY, liveProfileKey } from "@/contracts/asset";
import type { Bill, Invoice, Plan } from "@/contracts/model";
import { addDays, createWindow, isValidDate } from "@/domain";

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type StorageStatus = "ok" | "empty" | "unavailable" | "corrupt";
export const ACTIVE_OWNER_KEY = "afterbills:v1:active-owner";
export const storageKey = (profileKey: string) => `afterbills:v1:${profileKey}`;

export function validTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date(0));
    return timezone.length > 0 && timezone.length <= 100;
  } catch { return false; }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const units = (value: unknown, positive = false): value is string =>
  typeof value === "string" && /^(0|[1-9]\d{0,77})$/.test(value) &&
  (!positive || BigInt(value) > 0n);
const label = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 120;
const date = (value: unknown): value is string =>
  typeof value === "string" && isValidDate(value);

export function validatePlan(value: unknown, profileKey: string): Plan {
  if (!isRecord(value) || value.version !== 1 || value.profileKey !== profileKey ||
    !units(value.reserveUnits) || !isRecord(value.window) ||
    !date(value.window.startDate) || !date(value.window.endDateExclusive) ||
    value.window.dayCount !== 14 || typeof value.window.timezone !== "string" ||
    !validTimezone(value.window.timezone) ||
    addDays(value.window.startDate, 14) !== value.window.endDateExclusive ||
    typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt)) ||
    !Array.isArray(value.bills) || !Array.isArray(value.invoices) ||
    value.bills.length > 500 || value.invoices.length > 500) {
    throw new Error("This saved plan has an unsupported or invalid format.");
  }
  const bills: Bill[] = value.bills.map((item: unknown) => {
    if (!isRecord(item) || !label(item.id) || !label(item.title) ||
      !units(item.amountUnits, true) || !date(item.dueDate)) throw new Error("Invalid saved bill.");
    return { id: item.id, title: item.title, amountUnits: item.amountUnits, dueDate: item.dueDate };
  });
  const invoices: Invoice[] = value.invoices.map((item: unknown) => {
    if (!isRecord(item) || !label(item.id) || !label(item.clientLabel) ||
      !units(item.totalUnits, true) || !date(item.expectedDate) ||
      !["expected", "cancelled", "received_manual"].includes(String(item.status))) {
      throw new Error("Invalid saved invoice.");
    }
    return {
      id: item.id, clientLabel: item.clientLabel, totalUnits: item.totalUnits,
      expectedDate: item.expectedDate, status: item.status as Invoice["status"]
    };
  });
  if (new Set(bills.map(item => item.id)).size !== bills.length ||
    new Set(invoices.map(item => item.id)).size !== invoices.length) {
    throw new Error("Duplicate saved item identifiers.");
  }
  return {
    version: 1, profileKey, reserveUnits: value.reserveUnits,
    window: {
      startDate: value.window.startDate, endDateExclusive: value.window.endDateExclusive,
      timezone: value.window.timezone, dayCount: 14
    },
    bills, invoices, updatedAt: value.updatedAt
  };
}

export function loadPlan(profileKey: string, storage?: StoragePort): { plan?: Plan; status: StorageStatus } {
  if (!storage) return { status: "unavailable" };
  try {
    const raw = storage.getItem(storageKey(profileKey));
    if (raw === null) return { status: "empty" };
    try { return { plan: validatePlan(JSON.parse(raw), profileKey), status: "ok" }; }
    catch { return { status: "corrupt" }; }
  } catch { return { status: "unavailable" }; }
}

export function savePlan(plan: Plan, storage?: StoragePort): boolean {
  if (!storage) return false;
  try {
    storage.setItem(storageKey(plan.profileKey), JSON.stringify(validatePlan(plan, plan.profileKey)));
    return true;
  } catch { return false; }
}

export function clearPlan(profileKey: string, storage?: StoragePort): boolean {
  if (!storage) return false;
  try { storage.removeItem(storageKey(profileKey)); return true; }
  catch { return false; }
}

export function createLivePlan(owner: string, timezone: string, now: Date): Plan {
  return {
    version: 1, profileKey: liveProfileKey(owner), window: createWindow(timezone, now),
    reserveUnits: "0", bills: [], invoices: [], updatedAt: now.toISOString()
  };
}

export function reanchorPlan(plan: Plan, now: Date, timezone = plan.window.timezone): Plan {
  if (!validTimezone(timezone)) throw new Error("Choose a valid IANA timezone.");
  if (plan.profileKey === SAMPLE_PROFILE_KEY) {
    return plan.window.timezone === timezone ? plan : {
      ...plan, window: { ...plan.window, timezone }, updatedAt: now.toISOString()
    };
  }
  const next = createWindow(timezone, now);
  return next.startDate === plan.window.startDate && next.timezone === plan.window.timezone
    ? plan : { ...plan, window: next, updatedAt: now.toISOString() };
}

export const supportedAssetDescription = `${ASSET.displayLabel}, six decimal places`;
