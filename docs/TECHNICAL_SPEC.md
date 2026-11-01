# AfterBills technical specification

Architecture and implementation contract. Core P0 is now implemented locally;
see `../package.json` for exact dependencies and `VALIDATION.md` for evidence.
Sections labeled proposed retain the original blueprint. P1 remains future work.

## 1. Architecture and dependency choice

**Next.js App Router + TypeScript**, one application. React owns local planning
state; a pure domain module owns financial calculations; a narrow route handler
reads Solana. No Express service, Anchor program, database, login, agent wallet,
LLM, or payment facilitator.

```text
Sample fixture OR watched public address
             |
             v
Browser profile store <--- user-entered bills/reserve/invoices
             |                         (never sent to RPC)
             +----> pure budget/scenario engine ----> accessible UI
             ^
             |
POST /api/solana/snapshot -> allowlisted devnet RPC -> validated token snapshot
```

Implemented dependencies: Next.js/React/TypeScript, `@solana/addresses`, Vitest,
Testing Library, Playwright, and axe-core. Native fetch performs read-only RPC;
small explicit runtime validators enforce the frozen schema. Exact versions are
locked in `package.json`/`package-lock.json` and tested together. No duplicate
Solana SDK stacks or unused schema/motion/chart packages were added.

Optional P1 wallet connection: official wallet-adapter/Wallet Standard discovery,
without the legacy all-wallets bundle. Its SDK peer dependencies are an isolated
compatibility spike, not a reason to block the watch-address MVP.

## 2. Proposed module ownership

```text
src/
  app/                              # lead: routes, layout, integration
    api/solana/snapshot/route.ts     # chain worker exception
  domain/                           # engine worker
    money.ts budget.ts forecast.ts
  contracts/                        # lead; freeze before parallel work
    model.ts ports.ts view-model.ts
  server/solana/                    # chain worker; server-only
    rpc.ts snapshot.ts config.ts
  state/                            # planner worker
    profile-store.ts selectors.ts
  components/ui/                    # UI worker: primitives
  features/dashboard/               # UI worker: presentation, callbacks only
  features/planning/                # planner worker: forms and actions
  styles/                           # UI worker
  fixtures/                         # lead: labeled synthetic contract fixtures
tests/
  domain/ solana/ planning/ ui/      # corresponding chunk owner
  integration/ e2e/                 # lead
```

This tree was the ownership agreement and is now materialized in the local app.
Only the lead edits package/lock files, shared contracts, global config, or app
composition. Workers request dependency changes rather than installing in parallel.

## 3. Frozen contracts to materialize in C0

JSON money fields are base-10 integer strings; domain code converts to `bigint`.
Dates are validated `YYYY-MM-DD`, not localized timestamp strings.

| Type | Required fields and semantics |
|---|---|
| Network | P0 `devnet`; never inferred from a token symbol |
| AssetConfig | network, mint, decimals=6, displayLabel, testMoney=true |
| ProfileKey | mode + network + mint + owner; sample has its own non-wallet key |
| PlanningWindow | startDate, endDateExclusive, timezone, dayCount=14 |
| Bill | id, title, amountUnits>0, dueDate; deleting cancels the reservation |
| Invoice | id, clientLabel, totalUnits>0, expectedDate, status (`expected`, `cancelled`, `received_manual`) |
| Plan | version=1, profileKey, window, reserveUnits>=0, bills[], invoices[], updatedAt |
| WalletSnapshot | owner, network, mint, decimals, usableBalanceUnits, totalBalanceUnits, frozenUnits, slot, observedAt, delegatedWarning |
| Observation | status (`idle`, `loading`, `fresh`, `stale`, `error`), lastSuccess?, errorCode?, requestKey |
| BudgetResult | signedNetUnits, availableUnits, shortfallUnits, dailyPaceCents?, includedBillIds[], excludedBillIds[], assumptions[] |
| ForecastPoint | date, fundedUnits, expectedUnits, delayedUnits, belowReserve flags |
| PurchasePreview | purchaseUnits, baselineNetUnits, resultingNetUnits, shortfallUnits, dailyPaceCents? |

Ports:
- `calculateBudget(plan, usableBalanceUnits)` -> `BudgetResult`.
- `buildForecast(plan, usableBalanceUnits, delayDays)` -> `ForecastPoint[]`.
- `previewPurchase(budgetResult, purchaseUnits, dayCount)` -> `PurchasePreview`.
- `readSnapshot(owner, signal?, minContextSlot?)` -> `WalletSnapshot`.
- `loadPlan(profileKey)` / `savePlan(plan)` / `clearPlan(profileKey)`.

Dashboard receives a view model and action callbacks from the lead's composition
layer. It does not directly query RPC, parse storage, or recalculate money.
Forms use the shared money/date validation, not a second interpretation.

## 4. Deterministic engine

- No `parseFloat`, floating-point totals, locale-number parsing, or `toFixed`
  accounting. Use integer parsing and exact formatting helpers.
- Round pace/available downward to two display decimals; round deficits upward.
- Validate domain invariants again when loading local data.
- Inject today's date, timezone, and balance. No hidden wall clock in pure functions.
- Date-only arithmetic uses calendar-day ordinals, not elapsed milliseconds
  between local midnights. Derive today's calendar date through the stored IANA
  timezone; calendar-day increments must survive daylight-saving transitions.
- The 14-day window includes its start and excludes its end. Show actual dates.
- Live windows reanchor to today's local date on load/resume/timezone change and
  local date rollover. The state layer injects the new window; the engine remains
  pure. Sample mode deliberately retains its labeled fixed reference dates.
- Include open overdue bills. Mark them separately, never silently drop them.
- Forecast begins at current usable balance; bills subtract once. Reserve is
  a threshold; expected invoices add only to conditional lines.
- P0 uses end-of-day points and explicitly makes no within-day liquidity promise.
- Purchase previews never mutate plan, wallet balance, or invoice status.

Test against every PRD example, zero, missing data, overflow-range integers,
fractional cents, date boundaries, delay outside horizon, and rapid edits.

## 5. Read-only Solana adapter, P0

### Endpoint

`POST /api/solana/snapshot`

Body: validated public `owner`, optional bounded `minContextSlot` for later
receipt reconciliation. Network and mint come from server allowlist/config,
never a caller-supplied URL. Maximum small request body (e.g. 2 KB).

Response: validated `WalletSnapshot` with raw units serialized as strings.
No private plan data is accepted. Set `Cache-Control: no-store`; avoid address
query-string logging. Reject invalid address/body with 400, limited reads with
429, upstream failures with 502/504. Structured errors never echo RPC credentials.
Use same-origin access controls and hosting-provider cost/rate limits before
public deployment; an in-process limiter is not durable across serverless instances.

### Balance read

1. Validate base58 public-key encoding, not just its string length.
2. Use `getTokenAccountsByOwner` with canonical mint filter, `jsonParsed`,
   and `commitment: finalized`.
3. Validate each parsed account owner, mint, state, and decimals. Sum every
   matching account using raw `amount`; don't assume there is only one ATA.
4. Exclude frozen accounts from usable funds and return their separate total.
   Detect positive delegated amounts for a visible caution, not a guarantee.
5. Return the RPC context slot and successful observation time. No matching
   accounts on a successful response is a genuine zero; malformed/error is not.

A read requires no wallet, keypair, SOL, airdrop, or transaction signature.

### Refresh and races

- Initial read and explicit Refresh; optional refresh every 60 seconds only while
  visible, with a short cache/deduplication window to avoid duplicate requests.
- After 60 seconds mark the observation stale. A failed refresh also marks the
  last success stale immediately. Never retain a "fresh" badge after failure.
- Bound total request duration (~10 seconds); honor Retry-After and use at most
  two bounded attempts. Expose Retry rather than endless polling.
- Abort obsolete requests on owner/mode/network change; check requestKey before
  committing responses. Reject older slots within the same profile.
- Client ignores wallet results if the user has switched to sample.
- No silent fallback to sample, another network, or another mint.

### Config

- `SOLANA_RPC_URL`: server-only endpoint; no `NEXT_PUBLIC_` credential URL.
- `AFTERBILLS_NETWORK=devnet`: fail closed for other networks in P0.
- Canonical devnet USDC mint from research R14.
- Optional deployment-level test mint override only with explicit token label
  and validated decimals. A custom mint is not USDC.
- Browser gets public asset metadata through an explicit safe config boundary,
  never the credential-bearing RPC URL.

## 6. Persistence and privacy

P0: versioned browser localStorage and in-memory state. Store JSON unit strings
under `afterbills:v1:<mode>:<network>:<mint>:<owner>`. Sample has a separate fixed
profile key and synthetic data. Avoid initializing browser storage during SSR.

Persist bills/reserve/invoices/timezone and the 14-day horizon preference.
Window dates serialized in a plan are a reference, not authoritative after a
date change: rederive the live window before calculating, and test a midnight
rollover. Treat cached snapshots as stale until refreshed, not a fresh balance
after reload. Scope updates to profileKey.

If storage is blocked/full, retain a usable in-memory session and disclose that
changes will not persist. Invalid data is not silently overwritten. Explicit
clear removes only the selected profile. No encryption, backup, authentication,
or multi-device-sync claim. Treat labels as untrusted text; no HTML rendering.

No invoice/client text goes to the server or analytics. Public addresses still
reach hosting/RPC providers; explain that limitation. Do not record complete
financial profiles in debug logs or public demo recordings.

## 7. Receipt verification and reconciliation, P1 only

Do not make this chunk a hidden checkpoint dependency.

1. Discover recent signatures for owner plus owned supported-token accounts;
   deduplicate signatures. Bound history fetches and parser concurrency, expose
   `historyIncomplete` rather than promise a complete ledger. Historical closed
   accounts and provider retention can make discovery incomplete.
2. Allow manual signature lookup within the same validated read boundary.
3. Read finalized `getTransaction`, support known versioned transactions, require
   non-null metadata and `meta.err === null`. Missing evidence remains unverified.
4. Sum pre/post selected-mint balances for the watched owner across all accounts.
   A positive net delta is an incoming candidate, not proof of client income.
   Missing owner/mint/decimals or unsupported transaction versions fail closed.
5. ID receipt by network/mint/owner/signature. A replay cannot create a new credit.
6. Before allocation, read a balance at finalized context slot >= receipt slot
   (use minContextSlot). Funded budget uses that snapshot, never `B + receipt`.
7. User confirms invoice allocations. Sum allocations per receipt <= its amount;
   sum per invoice <= total. Undo restores only invoice expected-amount tracking,
   not wallet money. Preserve excess as unallocated receipt evidence.
8. For paid bills, only remove the reservation after the balance reflects its
   outgoing payment, or explicit confirmation of payment outside the watched
   wallet. Pending mismatches must not increase the funded recommendation.

Future contracts can add Receipt/Allocation types via a lead-owned revision.
Do not mutate C0 contracts concurrently while other chunks depend on them.
No comprehensive sender identity, fraud, tax, or income-classification claim.

## 8. Test and release contract

Implemented scripts:
`lint`, `typecheck`, `test`, `test:e2e`, `build`.

- Domain: exact unit math, dates, scenarios, shortfalls, no invoice inclusion.
- Adapter: mint/owner/decimal checks, multiple/frozen accounts, zero vs failure,
  malformed JSON-RPC, stale/race handling, timeout and rate-limit paths.
- State: reload, profile isolation, corrupted data, storage unavailable.
- UI: all specified states, accessible forms, final totals from domain only.
- Integration: synthetic fixtures prove the full UI/engine path.
- Real network: a separate recorded devnet snapshot proves a live read; mock
  tests do not. Never require funding for this test.
- Production build: desktop/mobile, keyboard/reduced motion, axe, console/network
  checks, no secret in client bundle. Real transfer evidence is separate P1.

Hosting is a proposed Vercel deployment, not an existing resource. Do not create
projects/env variables, publish, push code, or expose a server without permission.
