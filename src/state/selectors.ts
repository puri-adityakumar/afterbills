import type { Mode, Observation, Plan } from "@/contracts/model";
import type { DashboardViewModel } from "@/contracts/view-model";
import { SAMPLE_BALANCE_UNITS } from "@/fixtures/sample";
import { addDays, buildForecast, calculateBudget, formatCents, formatMoney, parseUnits, previewPurchase } from "@/domain";

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00.000Z`));
}

export function toDashboardModel({ plan, mode, owner, observation, storageWarning, purchaseOpen, purchaseInput, scenarioDelay }: {
  plan: Plan; mode: Mode; owner?: string; observation: Observation; storageWarning?: string;
  purchaseOpen: boolean; purchaseInput: string; scenarioDelay: 0 | 7;
}): DashboardViewModel {
  const snapshot = observation.requestKey === plan.profileKey ? observation.lastSuccess : undefined;
  const balance = mode === "sample" ? SAMPLE_BALANCE_UNITS : snapshot ? BigInt(snapshot.usableBalanceUnits) : undefined;
  const budget = balance === undefined ? undefined : calculateBudget(plan, balance);
  const commitments = budget ?? calculateBudget(plan, 0n);
  const money = (value: bigint) => formatMoney(value, value < 0n ? "up" : "down");
  let purchase: DashboardViewModel["purchase"];
  let purchaseError: string | undefined;
  if (purchaseOpen && purchaseInput.trim()) {
    try {
      const amount = parseUnits(purchaseInput);
      if (budget) {
        const result = previewPurchase(budget, amount, plan.window.dayCount);
        purchase = {
          amountLabel: money(amount), baselineLabel: money(budget.signedNetUnits),
          afterLabel: result.shortfallUnits > 0n ? formatMoney(result.shortfallUnits, "up") : money(result.resultingNetUnits),
          shortfall: result.shortfallUnits > 0n,
          dailyLabel: result.dailyPaceCents === undefined ? null : formatCents(result.dailyPaceCents)
        };
      } else purchaseError = "Read a balance before previewing a purchase.";
    } catch { purchaseError = "Use a positive decimal amount with up to 6 decimal places. No commas or exponents."; }
  }
  const forecasts = balance === undefined ? [] : buildForecast(plan, balance, 7);
  let observationLabel = "Fictional balance. Fixed sample dates.";
  if (mode === "live") {
    observationLabel = snapshot
      ? `Finalized at ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: plan.window.timezone }).format(new Date(snapshot.observedAt))} · slot ${snapshot.slot.toLocaleString("en-US")}`
      : owner ? "No successful balance read yet." : "No address selected.";
  }
  const warning = mode === "live"
    ? observation.errorCode ?? (observation.status === "stale" ? "This balance is over 60 seconds old. Refresh before relying on this plan." : undefined)
    : undefined;
  return {
    mode, owner, timezone: plan.window.timezone,
    windowLabel: `${dateLabel(plan.window.startDate)} to ${dateLabel(addDays(plan.window.endDateExclusive, -1))}, ${plan.window.startDate.slice(0, 4)}`,
    observationLabel, observationStatus: mode === "sample" ? "idle" : observation.status,
    netLabel: budget ? (budget.shortfallUnits > 0n ? formatMoney(budget.shortfallUnits, "up") : money(budget.availableUnits)) : "Unavailable",
    netKind: !budget ? "unknown" : budget.shortfallUnits > 0n ? "shortfall" : budget.availableUnits === 0n ? "zero" : "available",
    dailyLabel: budget?.dailyPaceCents === undefined ? null : formatCents(budget.dailyPaceCents),
    balanceLabel: balance === undefined ? "Unavailable" : money(balance),
    billsTotalLabel: money(commitments.includedBillsUnits), reserveLabel: money(BigInt(plan.reserveUnits)),
    signedNetLabel: budget ? money(budget.signedNetUnits) : "Unavailable",
    expectedTotalLabel: money(plan.invoices.filter(item => item.status === "expected").reduce((sum, item) => sum + BigInt(item.totalUnits), 0n)),
    billRows: [...plan.bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(item => ({
      id: item.id, title: item.title, amount: money(BigInt(item.amountUnits)), date: item.dueDate, dateLabel: dateLabel(item.dueDate),
      status: item.dueDate < plan.window.startDate ? "overdue" : item.dueDate >= plan.window.endDateExclusive ? "outside" : "upcoming"
    })),
    invoiceRows: [...plan.invoices].sort((a, b) => a.expectedDate.localeCompare(b.expectedDate)).map(item => ({
      id: item.id, clientLabel: item.clientLabel, amount: money(BigInt(item.totalUnits)),
      date: item.expectedDate, dateLabel: dateLabel(item.expectedDate), status: item.status,
      overdue: item.status === "expected" && item.expectedDate < plan.window.startDate
    })),
    forecastRows: forecasts.map(point => ({
      date: point.date, dateLabel: dateLabel(point.date), funded: money(point.fundedUnits),
      expected: money(point.expectedUnits), delayed: money(point.delayedUnits),
      belowReserve: scenarioDelay === 7 ? point.delayedBelowReserve : point.expectedBelowReserve
    })),
    scenarioDelay, purchaseOpen, purchaseInput, purchaseError, purchase, warning, storageWarning,
    frozenLabel: snapshot && BigInt(snapshot.frozenUnits) > 0n ? money(BigInt(snapshot.frozenUnits)) : undefined,
    delegatedWarning: snapshot?.delegatedWarning,
    exact: {
      balanceUnits: balance?.toString(), includedBillsUnits: commitments.includedBillsUnits.toString(),
      reserveUnits: plan.reserveUnits, signedNetUnits: budget?.signedNetUnits.toString()
    }
  };
}
