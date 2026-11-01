import type { ForecastPoint, Plan } from "@/contracts/model";
import { addDays, dateOrdinal } from "./dates";
import { assertNonnegativeUnits, readUnits } from "./money";
import { validatePlan } from "./validation";

/** End-of-day balances. Reserve is a threshold, never a second cash deduction. */
export function buildForecast(plan: Plan, usableBalanceUnits: bigint, delayDays: number): ForecastPoint[] {
  validatePlan(plan);
  assertNonnegativeUnits(usableBalanceUnits);
  if (!Number.isSafeInteger(delayDays) || delayDays < 0) throw new Error("Delay must be a nonnegative safe integer");
  const start = dateOrdinal(plan.window.startDate);
  const end = dateOrdinal(plan.window.endDateExclusive);
  const reserve = readUnits(plan.reserveUnits);
  const bills = new Map<number, bigint>();
  const invoices = new Map<number, bigint>();
  const delayedInvoices = new Map<number, bigint>();
  const accumulate = (events: Map<number, bigint>, day: number, units: bigint) => {
    if (day < end) events.set(day, (events.get(day) ?? 0n) + units);
  };
  for (const bill of plan.bills) {
    accumulate(bills, Math.max(start, dateOrdinal(bill.dueDate)), readUnits(bill.amountUnits, true));
  }
  for (const invoice of plan.invoices) {
    if (invoice.status !== "expected") continue;
    const due = dateOrdinal(invoice.expectedDate);
    const units = readUnits(invoice.totalUnits, true);
    accumulate(invoices, Math.max(start, due), units);
    // Shift the original date BEFORE clamping overdue invoices, not start + delay.
    // Ordinals also allow a valid large delay to move an invoice beyond the horizon.
    accumulate(delayedInvoices, Math.max(start, due + delayDays), units);
  }
  let fundedUnits = usableBalanceUnits;
  let expectedUnits = usableBalanceUnits;
  let delayedUnits = usableBalanceUnits;
  return Array.from({ length: plan.window.dayCount }, (_, index) => {
    const day = start + index;
    const outgoing = bills.get(day) ?? 0n;
    fundedUnits -= outgoing;
    expectedUnits += (invoices.get(day) ?? 0n) - outgoing;
    delayedUnits += (delayedInvoices.get(day) ?? 0n) - outgoing;
    return {
      date: addDays(plan.window.startDate, index),
      fundedUnits, expectedUnits, delayedUnits,
      fundedBelowReserve: fundedUnits < reserve,
      expectedBelowReserve: expectedUnits < reserve,
      delayedBelowReserve: delayedUnits < reserve,
    };
  });
}
