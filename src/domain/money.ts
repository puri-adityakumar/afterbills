export const UNITS_PER_TOKEN = 1_000_000n;
export const UNITS_PER_CENT = 10_000n;

/** User input: ordinary nonnegative decimal notation, with surrounding space allowed. */
export function parseUnits(input: string): bigint {
  if (typeof input !== "string") throw new Error("Amount must be a decimal string");
  const value = input.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(value)) {
    throw new Error("Use a nonnegative amount with at most six decimal places");
  }
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * UNITS_PER_TOKEN + BigInt(fraction.padEnd(6, "0"));
}

/** Stored units are integers, not user-facing decimal amounts. */
export function readUnits(input: string, positive = false): bigint {
  if (typeof input !== "string" || input.trim() !== input || !/^\d+$/.test(input)) {
    throw new Error("Stored amount must be a nonnegative integer string");
  }
  const units = BigInt(input);
  if (positive && units === 0n) throw new Error("Amount must be positive");
  return units;
}

export function assertNonnegativeUnits(value: bigint): void {
  if (typeof value !== "bigint" || value < 0n) {
    throw new Error("Amount must be a nonnegative bigint");
  }
}

export function formatCents(cents: bigint): string {
  if (typeof cents !== "bigint") throw new Error("Cents must be a bigint");
  const magnitude = cents < 0n ? -cents : cents;
  const whole = (magnitude / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${cents < 0n ? "-" : ""}${whole}.${(magnitude % 100n).toString().padStart(2, "0")}`;
}

/** Rounding applies to magnitude: down truncates, up exposes even a one-unit deficit. */
export function formatMoney(units: bigint, rounding: "down" | "up" = "down"): string {
  if (typeof units !== "bigint") throw new Error("Units must be a bigint");
  if (rounding !== "down" && rounding !== "up") throw new Error("Invalid rounding");
  const magnitude = units < 0n ? -units : units;
  const cents = (magnitude + (rounding === "up" ? UNITS_PER_CENT - 1n : 0n)) / UNITS_PER_CENT;
  return formatCents(units < 0n ? -cents : cents);
}
