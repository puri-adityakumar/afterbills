import { isAddress } from "@solana/addresses";
import { ASSET, STALE_AFTER_MS } from "@/contracts/asset";
import type { Observation, WalletSnapshot } from "@/contracts/model";

export function validOwner(value: string): boolean {
  return isAddress(value);
}

export function validateSnapshot(value: unknown, owner: string): WalletSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Invalid balance response.");
  const item = value as Record<string, unknown>;
  const rawUnits = (v: unknown): v is string => typeof v === "string" && /^(0|[1-9]\d{0,77})$/.test(v);
  if (item.owner !== owner || item.network !== ASSET.network || item.mint !== ASSET.mint ||
    item.decimals !== 6 || !rawUnits(item.usableBalanceUnits) || !rawUnits(item.totalBalanceUnits) ||
    !rawUnits(item.frozenUnits) || typeof item.slot !== "number" ||
    !Number.isSafeInteger(item.slot) || item.slot < 0 || typeof item.observedAt !== "string" ||
    !Number.isFinite(Date.parse(item.observedAt)) || typeof item.delegatedWarning !== "boolean" ||
    BigInt(item.usableBalanceUnits) + BigInt(item.frozenUnits) !== BigInt(item.totalBalanceUnits)) {
    throw new Error("The balance response could not be verified.");
  }
  return item as unknown as WalletSnapshot;
}

export async function fetchSnapshot(owner: string, signal: AbortSignal, minContextSlot?: number): Promise<WalletSnapshot> {
  if (!validOwner(owner)) throw new Error("Enter a valid Solana public address.");
  const response = await fetch("/api/solana/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner, ...(minContextSlot !== undefined ? { minContextSlot } : {}) }),
    cache: "no-store", signal
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error("Too many balance requests. Wait a moment, then retry.");
    if (response.status === 504) throw new Error("The balance read timed out. Please retry.");
    throw new Error("The devnet balance is unavailable. Please retry.");
  }
  return validateSnapshot(await response.json(), owner);
}

export function ageObservation(observation: Observation, now: number): Observation {
  if (observation.status === "fresh" && observation.lastSuccess &&
    now - Date.parse(observation.lastSuccess.observedAt) >= STALE_AFTER_MS) {
    return { ...observation, status: "stale" };
  }
  return observation;
}

export function acceptSnapshot(previous: Observation, snapshot: WalletSnapshot, profileKey: string): Observation {
  if (previous.requestKey !== profileKey) return previous;
  if (previous.lastSuccess && snapshot.slot < previous.lastSuccess.slot) {
    return { ...previous, status: "stale", errorCode: "An older balance response was ignored. Refresh again." };
  }
  return { status: "fresh", lastSuccess: snapshot, requestKey: profileKey };
}
