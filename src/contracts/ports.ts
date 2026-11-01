import type { BudgetResult, ForecastPoint, Plan, PurchasePreview, WalletSnapshot } from "./model";

export interface BudgetEngine {
  calculateBudget(plan: Plan, usableBalanceUnits: bigint): BudgetResult;
  buildForecast(plan: Plan, usableBalanceUnits: bigint, delayDays: number): ForecastPoint[];
  previewPurchase(budget: BudgetResult, purchaseUnits: bigint, dayCount: number): PurchasePreview;
}

export interface SnapshotReader {
  readSnapshot(owner: string, signal?: AbortSignal, minContextSlot?: number): Promise<WalletSnapshot>;
}
