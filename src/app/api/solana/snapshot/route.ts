import "server-only";
import { SnapshotError, safeSnapshotError } from "@/server/solana/errors";
import { deadline, readBounded } from "@/server/solana/io";
import { readSnapshot } from "@/server/solana/snapshot";
import { isRecord, validateInput } from "@/server/solana/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2048;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const MAX_IP_ENTRIES = 1000;
const requests = new Map<string, { start: number; count: number }>();

/**
 * Best-effort cost guard only: this in-process limiter is NOT durable/shared across
 * serverless instances. Deployment must sanitize forwarding headers and add durable
 * provider rate limits; absent IP headers deliberately share one anonymous bucket.
 */
function limit(request: Request) {
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") || "unknown").slice(0, 128);
  const now = Date.now();
  for (const [key, entry] of requests) if (now - entry.start >= WINDOW_MS) requests.delete(key);
  let entry = requests.get(ip);
  if (!entry) {
    // Fail closed when full, rather than evicting entries and letting churn bypass the cap.
    if (requests.size >= MAX_IP_ENTRIES) throw new SnapshotError("RATE_LIMITED", 429);
    entry = { start: now, count: 0 };
    requests.set(ip, entry);
  }
  if (++entry.count > MAX_REQUESTS) throw new SnapshotError("RATE_LIMITED", 429);
}

export async function POST(request: Request): Promise<Response> {
  const scope = deadline(request.signal);
  try {
    const origin = request.headers.get("origin");
    if (origin !== null && origin !== new URL(request.url).origin) throw new SnapshotError("FORBIDDEN_ORIGIN", 403);
    limit(request);
    const length = request.headers.get("content-length");
    if (length !== null && (!/^[0-9]+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
      throw new SnapshotError("BODY_TOO_LARGE", 413);
    }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
      throw new SnapshotError("INVALID_REQUEST", 400);
    }
    let body: unknown;
    try {
      body = JSON.parse(await readBounded(request.body, MAX_BODY_BYTES, scope.signal, new SnapshotError("BODY_TOO_LARGE", 413)));
    } catch (error) {
      if (error instanceof SnapshotError) throw error;
      throw new SnapshotError("INVALID_REQUEST", 400);
    }
    if (!isRecord(body) || Object.keys(body).some(key => key !== "owner" && key !== "minContextSlot")) {
      throw new SnapshotError("INVALID_REQUEST", 400);
    }
    validateInput(body.owner, body.minContextSlot);
    const snapshot = await readSnapshot(body.owner, scope.signal, body.minContextSlot as number | undefined);
    return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const safe = safeSnapshotError(error);
    return Response.json({ error: { code: safe.code, message: safe.message } }, {
      status: safe.status,
      headers: { "Cache-Control": "no-store", ...(safe.status === 429 ? { "Retry-After": "60" } : {}) }
    });
  } finally {
    scope.dispose();
  }
}
