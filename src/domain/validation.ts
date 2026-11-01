import type { Plan } from "@/contracts/model";
import { isValidDate, validateWindow } from "./dates";
import { readUnits } from "./money";

function requireText(value: string): void {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error("Required text is missing");
}

/** Revalidate persisted plans before accounting; no invalid entry is silently omitted. */
export function validatePlan(plan: Plan): void {
  if (!plan || plan.version !== 1) throw new Error("Unsupported plan version");
  requireText(plan.profileKey);
  validateWindow(plan.window);
  readUnits(plan.reserveUnits);
  if (typeof plan.updatedAt !== "string" || !Number.isFinite(Date.parse(plan.updatedAt))) {
    throw new Error("Invalid update timestamp");
  }
  if (!Array.isArray(plan.bills) || !Array.isArray(plan.invoices)) throw new Error("Invalid plan entries");
  const billIds = new Set<string>();
  for (const bill of plan.bills) {
    if (!bill) throw new Error("Invalid bill");
    requireText(bill.id);
    requireText(bill.title);
    if (billIds.has(bill.id)) throw new Error("Duplicate bill id");
    billIds.add(bill.id);
    readUnits(bill.amountUnits, true);
    if (!isValidDate(bill.dueDate)) throw new Error("Invalid bill due date");
  }
  const invoiceIds = new Set<string>();
  for (const invoice of plan.invoices) {
    if (!invoice) throw new Error("Invalid invoice");
    requireText(invoice.id);
    requireText(invoice.clientLabel);
    if (invoiceIds.has(invoice.id)) throw new Error("Duplicate invoice id");
    invoiceIds.add(invoice.id);
    readUnits(invoice.totalUnits, true);
    if (!isValidDate(invoice.expectedDate)) throw new Error("Invalid invoice expected date");
    if (!["expected", "cancelled", "received_manual"].includes(invoice.status)) throw new Error("Invalid invoice status");
  }
}
