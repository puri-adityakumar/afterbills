import { expect, it, vi } from "vitest";
import { ASSET } from "@/contracts/asset";

vi.mock("server-only", () => ({}));

it.skipIf(process.env.RUN_LIVE_RPC !== "1")("reads real finalized devnet USDC without a wallet or funding", async () => {
  const { readSnapshot } = await import("@/server/solana/snapshot");
  // A well-known public program address, not a user's wallet or invented test key.
  const owner = "11111111111111111111111111111111";
  const result = await readSnapshot(owner);
  expect(result.owner).toBe(owner);
  expect(result.network).toBe("devnet");
  expect(result.mint).toBe(ASSET.mint);
  expect(result.slot).toBeGreaterThan(0);
  expect(BigInt(result.totalBalanceUnits)).toBe(BigInt(result.usableBalanceUnits) + BigInt(result.frozenUnits));
  console.info("REAL_DEVNET_READ", JSON.stringify(result));
}, 20_000);
