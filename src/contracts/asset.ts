import type { AssetConfig } from "./model";

export const ASSET: AssetConfig = {
  network: "devnet",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  decimals: 6,
  displayLabel: "Devnet USDC",
  testMoney: true
};
export const SAMPLE_PROFILE_KEY = `sample:devnet:${ASSET.mint}:fictional`;
export const STALE_AFTER_MS = 60_000;
export const liveProfileKey = (owner: string) => `live:devnet:${ASSET.mint}:${owner}`;
