/** JSON money is an exact base-10 integer string in six-decimal token units. */
export type Units = string;
export type DateOnly = string;
export type Mode = "sample" | "live";

export interface AssetConfig {
  network: "devnet";
  mint: string;
  decimals: 6;
  displayLabel: string;
  testMoney: true;
}

export interface PlanningWindow {
  startDate: DateOnly;
  endDateExclusive: DateOnly;
  timezone: string;
  dayCount: 14;
}

export interface Bill {
  id: string;
  title: string;
  amountUnits: Units;
  dueDate: DateOnly;
}

export interface Invoice {
  id: string;
  clientLabel: string;
  totalUnits: Units;
  expectedDate: DateOnly;
  status: "expected" | "cancelled" | "received_manual";
}

export interface Plan {
  version: 1;
  profileKey: string;
  window: PlanningWindow;
  reserveUnits: Units;
  bills: Bill[];
  invoices: Invoice[];
  updatedAt: string;
}

export interface WalletSnapshot {
  owner: string;
  network: "devnet";
  mint: string;
  decimals: 6;
  usableBalanceUnits: Units;
  totalBalanceUnits: Units;
  frozenUnits: Units;
  slot: number;
  observedAt: string;
  delegatedWarning: boolean;
}

export type ObservationStatus = "idle" | "loading" | "fresh" | "stale" | "error";
export interface Observation {
  status: ObservationStatus;
  lastSuccess?: WalletSnapshot;
  errorCode?: string;
  requestKey: string;
}

/** Engine outputs use bigint; never serialize these without formatting. */
export interface BudgetResult {
  signedNetUnits: bigint;
  availableUnits: bigint;
  shortfallUnits: bigint;
  includedBillsUnits: bigint;
  dailyPaceCents?: bigint;
  includedBillIds: string[];
  excludedBillIds: string[];
  assumptions: string[];
}

export interface ForecastPoint {
  date: DateOnly;
  fundedUnits: bigint;
  expectedUnits: bigint;
  delayedUnits: bigint;
  fundedBelowReserve: boolean;
  expectedBelowReserve: boolean;
  delayedBelowReserve: boolean;
}

export interface PurchasePreview {
  purchaseUnits: bigint;
  baselineNetUnits: bigint;
  resultingNetUnits: bigint;
  shortfallUnits: bigint;
  dailyPaceCents?: bigint;
}
