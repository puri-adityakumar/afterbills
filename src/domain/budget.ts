import type { BudgetResult, Plan, PurchasePreview } from "@/contracts/model";
import { assertNonnegativeUnits, readUnits, UNITS_PER_CENT } from "./money";
import { validatePlan } from "./validation";

export function calculateBudget(plan: Plan, usableBalanceUnits: bigint): BudgetResult {
  validatePlan(plan);
  assertNonnegativeUnits(usableBalanceUnits);
  const included = plan.bills.filter((bill) => bill.dueDate < plan.window.endDateExclusive);
  const excluded = plan.bills.filter((bill) => bill.dueDate >= plan.window.endDateExclusive);
  const includedBillsUnits = included.reduce((sum, bill) => sum + readUnits(bill.amountUnits, true), 0n);
  const signedNetUnits = usableBalanceUnits - includedBillsUnits - readUnits(plan.reserveUnits);
  return {
    signedNetUnits,
    availableUnits: signedNetUnits > 0n ? signedNetUnits : 0n,
    shortfallUnits: signedNetUnits < 0n ? -signedNetUnits : 0n,
    includedBillsUnits,
    ...(signedNetUnits >= 0n ? { dailyPaceCents: signedNetUnits / (UNITS_PER_CENT * BigInt(plan.window.dayCount)) } : {}),
    includedBillIds: included.map((bill) => bill.id),
    excludedBillIds: excluded.map((bill) => bill.id),
    assumptions: [
      "Based on the commitments you entered.",
      "Unpaid invoices are excluded from the funded amount.",
      "Open overdue bills are included; bills on or after the exclusive end date are excluded.",
      "Reserve is a planning buffer, not locked funds.",
      "Available amounts and daily pace round down; shortfall display rounds up.",
    ],
  };
}

export function previewPurchase(budget: BudgetResult, purchaseUnits: bigint, dayCount: number): PurchasePreview {
  assertNonnegativeUnits(purchaseUnits);
  if (!Number.isSafeInteger(dayCount) || dayCount <= 0) throw new Error("Day count must be a positive safe integer");
  if (!budget || typeof budget.signedNetUnits !== "bigint") throw new Error("Invalid budget");
  assertNonnegativeUnits(budget.availableUnits);
  assertNonnegativeUnits(budget.shortfallUnits);
  assertNonnegativeUnits(budget.includedBillsUnits);
  const baselineNetUnits = budget.signedNetUnits;
  if (budget.availableUnits !== (baselineNetUnits > 0n ? baselineNetUnits : 0n)
    || budget.shortfallUnits !== (baselineNetUnits < 0n ? -baselineNetUnits : 0n)
    || (baselineNetUnits < 0n && budget.dailyPaceCents !== undefined)) {
    throw new Error("Inconsistent budget amounts");
  }
  if (budget.dailyPaceCents !== undefined) assertNonnegativeUnits(budget.dailyPaceCents);
  const resultingNetUnits = baselineNetUnits - purchaseUnits;
  return {
    purchaseUnits, baselineNetUnits, resultingNetUnits,
    shortfallUnits: resultingNetUnits < 0n ? -resultingNetUnits : 0n,
    ...(resultingNetUnits >= 0n ? { dailyPaceCents: resultingNetUnits / (UNITS_PER_CENT * BigInt(dayCount)) } : {}),
  };
}
