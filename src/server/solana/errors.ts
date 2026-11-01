import "server-only";

export type SnapshotErrorCode =
  | "INVALID_REQUEST" | "FORBIDDEN_ORIGIN" | "BODY_TOO_LARGE"
  | "RATE_LIMITED" | "RPC_RATE_LIMITED" | "RPC_UNAVAILABLE"
  | "INVALID_RPC_RESPONSE" | "STALE_CONTEXT" | "TIMEOUT" | "ABORTED"
  | "CONFIGURATION_ERROR";

/** Only these fixed messages, never an upstream body/URL, may cross the API boundary. */
const messages: Record<SnapshotErrorCode, string> = {
  INVALID_REQUEST: "Provide a valid public owner address and optional nonnegative safe-integer minContextSlot.",
  FORBIDDEN_ORIGIN: "Cross-origin snapshot requests are not allowed.",
  BODY_TOO_LARGE: "The request body exceeds 2048 bytes.",
  RATE_LIMITED: "Too many snapshot requests. Try again in a minute.",
  RPC_RATE_LIMITED: "The devnet provider is rate limiting reads. Try again later.",
  RPC_UNAVAILABLE: "The devnet balance could not be read. Its value is unknown.",
  INVALID_RPC_RESPONSE: "The devnet provider returned an invalid snapshot. Its value is unknown.",
  STALE_CONTEXT: "The devnet snapshot is older than the requested slot. Refresh again.",
  TIMEOUT: "The devnet balance read timed out. Try again.",
  ABORTED: "The balance read was cancelled.",
  CONFIGURATION_ERROR: "The devnet read service is not configured correctly."
};

export class SnapshotError extends Error {
  constructor(public readonly code: SnapshotErrorCode, public readonly status: number) {
    super(messages[code]);
    this.name = "SnapshotError";
  }
}

export function safeSnapshotError(error: unknown): SnapshotError {
  return error instanceof SnapshotError ? error : new SnapshotError("RPC_UNAVAILABLE", 502);
}
