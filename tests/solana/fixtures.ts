import { ASSET } from "@/contracts/asset";

export const OWNER = "11111111111111111111111111111111";
export const OTHER = "So11111111111111111111111111111111111111112";
export const PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export interface AccountOptions {
  amount?: string;
  decimals?: number;
  owner?: string;
  mint?: string;
  state?: string;
  program?: string;
  dataProgram?: string;
  type?: string;
  pubkey?: string;
  delegate?: string;
  delegatedAmount?: unknown;
  executable?: boolean;
}

export function tokenAccount(options: AccountOptions = {}) {
  return {
    pubkey: options.pubkey ?? OTHER,
    account: {
      owner: options.program ?? PROGRAM,
      executable: options.executable ?? false,
      data: {
        program: options.dataProgram ?? "spl-token",
        parsed: {
          type: options.type ?? "account",
          info: {
            owner: options.owner ?? OWNER,
            mint: options.mint ?? ASSET.mint,
            state: options.state ?? "initialized",
            tokenAmount: { amount: options.amount ?? "1234567", decimals: options.decimals ?? 6, uiAmount: 99999 },
            ...(options.delegate === undefined ? {} : { delegate: options.delegate }),
            ...(options.delegatedAmount === undefined ? {} : { delegatedAmount: options.delegatedAmount })
          }
        }
      }
    }
  };
}

export function rpcPayload(accounts: unknown[] = [], slot = 123) {
  return { jsonrpc: "2.0", id: 1, result: { context: { slot }, value: accounts } };
}

export const rpcResponse = (accounts: unknown[] = [], slot = 123) => Response.json(rpcPayload(accounts, slot));
