import "server-only";
import { isAddress } from "@solana/addresses";
import { SnapshotError } from "./errors";

export function isPublicAddress(value: unknown): value is string {
  return typeof value === "string" && value.length >= 32 && value.length <= 44 && isAddress(value);
}

export function isContextSlot(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function validateInput(owner: unknown, minContextSlot?: unknown): asserts owner is string {
  if (!isPublicAddress(owner) || (minContextSlot !== undefined && !isContextSlot(minContextSlot))) {
    throw new SnapshotError("INVALID_REQUEST", 400);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
