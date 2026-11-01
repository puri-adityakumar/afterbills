# AfterBills: product requirements

Version: requirements 1.0, 2026-10-31. Core P0 implemented locally. See
`VALIDATION.md` for evidence; targets and future items below are not adoption
metrics or claims of P1 completion.

## 1. Product definition

**Promise:** Plan around the money you have, and see what changes when you get paid.

AfterBills combines an observed Solana USDC balance with user-entered bills,
expected invoices, and a reserve. It answers:

1. What remains after my listed commitments?
2. How would a purchase affect that amount?
3. What changes if an expected client payment is late?

The funded answer and the conditional outlook must never be mixed.

### Audience and problem hypothesis

Primary user: an independent freelancer already receiving some income in USDC,
with uneven client payment timing and bills due on specific dates.

Hypothesis, not validated demand: a wallet balance overstates what this person
feels able to spend because it does not reflect obligations or their buffer.
Start with one watched wallet; do not imply visibility into banks, exchanges,
other wallets, card subscriptions, taxes, or the user's entire financial life.

Before claiming adoption potential as a fact, test the prototype with three
freelancers. Ask whether they would enter bills, trust the explanation, and return
after a payment. Do not invent interview quotes or traction.

### Positioning

- Consumer planning tool, not an agent wallet, bank, trading terminal, or chatbot.
- USDC-unit estimates, not guarantees of USD redemption, affordability, or solvency.
- Clear arithmetic and assumptions, not automated financial advice.
- Browser-local prototype, not a production-secure financial-data service.

## 2. Hackathon fit and success

Enter **Best Consumer App on Solana**. The meaningful Solana dependency is that
observed token balances, their freshness, and later receipt evidence determine
the plan. The app is not a wallet-connect-only wrapper.

Checkpoint success: a reviewer can open a labeled sample without a wallet, enter
their own public devnet address, see a real token balance, add commitments, inspect
the funded calculation, and compare an explicitly conditional invoice scenario.

Quality targets, not achieved metrics:

- Complete sample onboarding in under 2 minutes without signing.
- Explain why unpaid invoices are excluded after one walkthrough.
- Reproduce every displayed total with deterministic tests.
- Complete the core flow at 390px and desktop widths using keyboard or touch.
- Show genuine devnet-read evidence separately from fictional financial examples.

## 3. Scope

### P0: checkpoint must-haves

| ID | Requirement | Acceptance |
|---|---|---|
| P0-01 | Sample and live read-only entry | Sample requires no wallet; watch-address path performs a real devnet read and never signs. |
| P0-02 | Exact supported-token balance | Sum all matching owned token accounts; show network, asset, observation time, and stale/error state. |
| P0-03 | One-off bills | Add, edit, and delete title, positive amount, and date. Open overdue bills remain included. |
| P0-04 | Reserve and horizon | Nonnegative reserve and explicit 14-day date window; reserve is not locked. |
| P0-05 | Funded budget | Visible balance minus included bills minus reserve; invoices excluded; shortfalls not hidden. |
| P0-06 | Expected invoices | Add/edit/cancel amount, client label, expected date; explicitly user-entered and uncertain. |
| P0-07 | Purchase what-if | Preview one purchase without moving funds or persisting an expense. Reset restores the plan. |
| P0-08 | Late-payment scenario | Compare expected dates with a 7-day delay; no change to funded budget. |
| P0-09 | Local persistence | Versioned, isolated sample/live profiles; reload works; clear-local-data action. |
| P0-10 | Honest responsive UX | Mobile, desktop, empty, loading, stale, zero, deficit, invalid-input, and storage-failure states. |

### P1: after core passes, before final if time permits

- Wallet Standard connection as an alternative to pasting a public address.
- Verified recent incoming-token receipts with explorer links.
- Reversible, user-confirmed invoice allocation, including partial receipts.
- Reconciliation of paid bills against a refreshed balance.
- 7/30-day horizons, export/import, and opt-in local classification corrections.

These are not checkpoint dependencies. An honest live balance refresh is more
valuable than a rushed claim of automatic invoice verification.

### Out of scope

Custody, token delegation, new programs, bank sync, fiat payouts, exchange
accounts, tax calculation, recurring-bill inference, automatic bill payment,
credit, investment products, automatic trading, AI-generated accounting,
multi-chain aggregation, guaranteed scam checks, x402, and Aurora integrations.
No Sui/Walrus/Tatum work is needed for the selected track.

## 4. Financial rules: source of truth

### Inputs and dates

- Money: nonnegative integer base units, 6 decimals for the supported token.
- Reject negative inputs, scientific notation, NaN, and more than 6 decimals.
- Date window: `[startDate, endDateExclusive)` in the user's stored IANA timezone.
  P0 is 14 calendar dates including the start date. Inject today's date into tests.
- Live plans use a rolling window starting on the current local date. Recompute
  on reload, resume, timezone change, or local date rollover; never reuse yesterday's
  stored window as if it started today. Sample mode keeps its disclosed fixed dates.
- Include every open bill with `dueDate < endDateExclusive`, including overdue
  bills. Exclude canceled/deleted bills and show beyond-window bills separately.
- Reserve is global to this plan, not deducted once per bill or per day.

Let `B` be the latest valid observed balance, `C` the included bills, `R` reserve,
and `D` the number of dates in the window:

```text
fundedNet = B - C - R
available = max(fundedNet, 0)
shortfall = max(-fundedNet, 0)
dailyPaceCents = floor(available / (10_000 * D))
```

One cent is 10,000 base units for a 6-decimal dollar-denominated token. Keep full
units internally; round positive available values and daily pace down for display,
and shortfalls up so tiny deficits do not appear as zero. Label USDC explicitly;
do not price SOL or claim live currency conversion. Show exact units on inspection.

`B` unknown: no funded result. `B` stale: show the last calculation as a stale
reference, not a current recommendation. A shortfall replaces the positive hero
with "Shortfall: [amount]"; do not show a reassuring zero or daily allowance.

### What-if purchase

For proposed nonnegative purchase `P`:

```text
purchaseNet = fundedNet - P
```

Preview only. No transaction, wallet signature, inferred category, or hidden
permanent budget mutation. A positive result means "fits the entered plan,"
not unconditional permission to buy.

### Forecasts

Funded trajectory starts at `B` and subtracts included scheduled bills.
Expected trajectory additionally includes each still-unpaid invoice's remaining
amount on the user-entered expected date. The delayed trajectory shifts these
dates by 7 days. Due/overdue bills are effective on the start date when needed.
Past-due unpaid invoices use the later of their scenario date or the start date
and remain labeled overdue/uncertain.

These lines model listed commitments only, not unentered food, spending,
exchange rates, or probabilistic payment arrival. Reserve is a visible threshold,
not an expense subtracted again from the trajectory.

Changing an invoice date never changes `fundedNet`. If a delayed invoice remains
inside the window, the ending expected balance can be identical while the middle
of the path differs. Do not fabricate a shortfall merely for a dramatic demo.

### Received invoices and paid bills

P0 may optionally mark an invoice "received, manually recorded." This removes its
remaining amount from future expected inflows but never increases `B`.
Do not label this verified. Automated matching and partial allocations are P1.

Deleting a bill only changes a planning assumption. Require confirmation that it
is no longer owed. Do not present deletion as proof of payment. A later "paid"
action must not release the commitment against a pre-payment balance.

## 5. Canonical acceptance examples

Use synthetic data with a frozen start date `2026-11-01`, end exclusive
`2026-11-15`, and `Asia/Kolkata`. Never present these as a real person's finances.

| Case | Inputs | Expected result |
|---|---|---|
| Base | B=1,200; rent=650 on Nov 8; utilities/software=120 on Nov 10; R=150 | Net=280; 20.00/day over 14 days. |
| Unpaid income | Base plus invoice=800 due Nov 6 | Funded net stays 280. Invoice appears only in outlook. |
| Delayed invoice | Same invoice shifted to Nov 13 | Funded net stays 280; middle of expected path changes, ending total can match. |
| Purchase | Base plus purchase preview=180 | Net=100; displayed daily pace=7.14. Reset returns 280. |
| Deficit | B=1,200; bills=1,300+120; R=150 | Shortfall=370; no positive daily pace. |
| Actual receipt | Observed B refreshes from 1,200 to 2,000; invoice manually recorded received | Net=1,080; daily pace=77.14; do not add 800 again. |
| Horizon boundary | One bill on Nov 14 and one on Nov 15 | Include Nov 14; exclude Nov 15 and disclose it. |
| Overdue bill | Open bill due Oct 30 | Include, even though before start date. |
| Unknown versus zero | Failed RPC versus successful read with no matching account | Failure is unknown/stale; successful absence is 0. |
| Alternate mint | Token named USDC but wrong mint | Exclude; no symbol-based trust. |

Additional tests: multiple token accounts, frozen/delegated balances, >safe-integer
amounts, reload, timezone/DST boundaries, rapid profile switches, tiny deficits,
invalid amounts, stale responses, and sample/live isolation.

Frozen token balances must not be treated as usable: show them separately and
exclude them. For a detected third-party delegation, show a warning; do not claim
the reserve is protected from it. No asset movement is authorized by AfterBills.

## 6. Privacy and trust

- No private keys, seed phrases, signing methods, or money-moving API.
- Public-address queries disclose the address to the hosting/RPC infrastructure.
- Bills/client labels remain in browser storage; not encrypted merely because local.
- No LLM, analytics, error tracker, or public recording receives real financial notes.
- Disconnect does not silently erase a plan; provide an explicit clear action and
  shared-device warning. Sample reset must never clear a live profile.
- Display "Based on the commitments you entered" and observation time near results.

## 7. Evidence gates and open questions

Unvalidated: user willingness to maintain manual commitments; name availability;
production RPC choice; optional wallet-package compatibility; live test-wallet
funding for receipt demonstrations. Dependencies and local production builds are
now tested; public deployment is not.

No funded wallet is needed to read a public address. A recorded balance-change
demo does require a separately funded devnet fixture or a user-authorized test
transfer. If unavailable, show live read evidence plus clearly labeled replay.

Final acceptance must reference actual test reports, screenshots, RPC evidence,
and working links. A written task or mock response is not completed integration.
