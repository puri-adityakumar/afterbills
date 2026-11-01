import "server-only";
import { SnapshotError } from "./errors";

export const REQUEST_TIMEOUT_MS = 10_000;

/** Covers fetch, streaming bodies and retry waits, including a non-cooperative transport. */
export function deadline(parent?: AbortSignal, duration = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const abort = () => controller.abort(
    parent?.reason instanceof SnapshotError ? parent.reason : new SnapshotError("ABORTED", 499)
  );
  if (parent?.aborted) abort();
  else parent?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(new SnapshotError("TIMEOUT", 504)), duration);
  return {
    signal: controller.signal,
    expiresAt: Date.now() + duration,
    dispose() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", abort);
    }
  };
}

export function abortError(signal: AbortSignal): SnapshotError {
  return signal.reason instanceof SnapshotError ? signal.reason : new SnapshotError("ABORTED", 499);
}

export async function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    // The operation may already have started; consume a later transport rejection.
    void operation.catch(() => {});
    throw abortError(signal);
  }
  let onAbort: () => void = () => {};
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        onAbort = () => reject(abortError(signal));
        signal.addEventListener("abort", onAbort, { once: true });
      })
    ]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

export async function readBounded(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  signal: AbortSignal,
  tooLarge: SnapshotError
): Promise<string> {
  if (signal.aborted) throw abortError(signal);
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let complete = false;
  try {
    while (true) {
      const { done, value } = await abortable(reader.read(), signal);
      if (done) { complete = true; break; }
      size += value.byteLength;
      if (size > maxBytes) throw tooLarge;
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    if (!complete) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function waitForRetry(ms: number, signal: AbortSignal) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await abortable(new Promise<void>(resolve => { timer = setTimeout(resolve, ms); }), signal);
  } finally {
    clearTimeout(timer);
  }
}
