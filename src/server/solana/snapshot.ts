import "server-only";
import { ASSET } from "@/contracts/asset";
import type { WalletSnapshot } from "@/contracts/model";
import { SnapshotError, safeSnapshotError } from "./errors";
import { abortable, abortError, deadline, readBounded, waitForRetry } from "./io";
import { isContextSlot, isPublicAddress, isRecord, validateInput } from "./validation";

export { SnapshotError, safeSnapshotError } from "./errors";
export const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const MAX_RPC_BYTES = 2 * 1024 * 1024;
const invalid = () => new SnapshotError("INVALID_RPC_RESPONSE", 502);

function rpcUrl(): string {
  if ((process.env.AFTERBILLS_NETWORK ?? "devnet") !== "devnet") {
    throw new SnapshotError("CONFIGURATION_ERROR", 500);
  }
  try {
    const url = new URL(process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com");
    if (!["https:", "http:"].includes(url.protocol) || url.hash || url.username || url.password) throw Error();
    return url.href;
  } catch {
    throw new SnapshotError("CONFIGURATION_ERROR", 500);
  }
}

function rawAmount(value: unknown): bigint {
  if (!isRecord(value) || value.decimals !== ASSET.decimals || typeof value.amount !== "string" ||
      !/^(0|[1-9][0-9]{0,19})$/.test(value.amount)) throw invalid();
  const units = BigInt(value.amount);
  if (units > 18_446_744_073_709_551_615n) throw invalid();
  return units;
}

function parseSnapshot(payload: unknown, owner: string, minContextSlot?: number): WalletSnapshot {
  if (!isRecord(payload) || payload.jsonrpc !== "2.0" || payload.id !== 1 ||
      "error" in payload || !isRecord(payload.result)) throw invalid();
  const { context, value } = payload.result;
  if (!isRecord(context) || !isContextSlot(context.slot) || !Array.isArray(value)) throw invalid();
  if (minContextSlot !== undefined && context.slot < minContextSlot) throw new SnapshotError("STALE_CONTEXT", 502);
  let total = 0n;
  let frozen = 0n;
  let delegatedWarning = false;
  const seen = new Set<string>();
  for (const entry of value) {
    if (!isRecord(entry) || !isPublicAddress(entry.pubkey) || seen.has(entry.pubkey) ||
        !isRecord(entry.account)) throw invalid();
    seen.add(entry.pubkey);
    const account = entry.account;
    if (account.owner !== TOKEN_PROGRAM || account.executable !== false || !isRecord(account.data)) throw invalid();
    const data = account.data;
    if (data.program !== "spl-token" || !isRecord(data.parsed) ||
        data.parsed.type !== "account" || !isRecord(data.parsed.info)) throw invalid();
    const info = data.parsed.info;
    if (info.owner !== owner || info.mint !== ASSET.mint ||
        (info.state !== "initialized" && info.state !== "frozen")) throw invalid();
    const amount = rawAmount(info.tokenAmount);
    if ("delegate" in info || "delegatedAmount" in info) {
      if (!isPublicAddress(info.delegate)) throw invalid();
      if (rawAmount(info.delegatedAmount) > 0n) delegatedWarning = true;
    }
    total += amount;
    if (info.state === "frozen") frozen += amount;
  }
  return {
    owner, network: ASSET.network, mint: ASSET.mint, decimals: ASSET.decimals,
    usableBalanceUnits: (total - frozen).toString(), totalBalanceUnits: total.toString(),
    frozenUnits: frozen.toString(), slot: context.slot, observedAt: new Date().toISOString(), delegatedWarning
  };
}

function retryDelay(response: Response): number {
  const header = response.headers.get("retry-after");
  if (header === null) return 250;
  if (/^[0-9]+(?:\.[0-9]+)?$/.test(header.trim())) return Number(header) * 1000;
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 250;
}

/** Read-only finalized canonical devnet USDC; no caller-selectable method, mint or endpoint. */
export async function readSnapshot(owner: string, signal?: AbortSignal, minContextSlot?: number): Promise<WalletSnapshot> {
  validateInput(owner, minContextSlot);
  const url = rpcUrl();
  const scope = deadline(signal);
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (scope.signal.aborted) throw abortError(scope.signal);
      let response: Response;
      try {
        response = await abortable(fetch(url, {
          method: "POST", cache: "no-store", redirect: "error", credentials: "omit",
          headers: { "Content-Type": "application/json" }, signal: scope.signal,
          body: JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "getTokenAccountsByOwner",
            params: [owner, { mint: ASSET.mint }, {
              encoding: "jsonParsed", commitment: "finalized",
              ...(minContextSlot === undefined ? {} : { minContextSlot })
            }]
          })
        }), scope.signal);
      } catch {
        if (scope.signal.aborted) throw abortError(scope.signal);
        if (attempt === 1) throw new SnapshotError("RPC_UNAVAILABLE", 502);
        await waitForRetry(250, scope.signal);
        continue;
      }
      if (!response.ok) {
        // Never parse, return or log an upstream error body (it may contain provider secrets).
        if (response.body) void response.body.cancel().catch(() => {});
        const limited = response.status === 429;
        const error = new SnapshotError(limited ? "RPC_RATE_LIMITED" : "RPC_UNAVAILABLE", limited ? 429 : 502);
        const retryable = limited || [502, 503, 504].includes(response.status);
        const delay = retryDelay(response);
        if (attempt === 1 || !retryable || !Number.isFinite(delay) || delay >= scope.expiresAt - Date.now()) throw error;
        await waitForRetry(delay, scope.signal);
        continue;
      }
      let payload: unknown;
      try {
        payload = JSON.parse(await readBounded(response.body, MAX_RPC_BYTES, scope.signal, invalid()));
      } catch (error) {
        if (scope.signal.aborted) throw abortError(scope.signal);
        if (error instanceof SnapshotError) throw error;
        throw invalid();
      }
      return parseSnapshot(payload, owner, minContextSlot);
    }
    throw new SnapshotError("RPC_UNAVAILABLE", 502);
  } catch (error) {
    throw safeSnapshotError(error);
  } finally {
    scope.dispose();
  }
}
