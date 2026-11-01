# AfterBills UI specification

UI implementation contract. Landing, dashboard, planning dialogs, and required
P0 states are now built locally. See `VALIDATION.md` for actual browser evidence.
Visual system: `../DESIGN.md`. Money rules: `PRD.md`.

## 1. Information architecture

| Location | Purpose | Priority |
|---|---|---|
| `/` | Explain product, open sample, or watch a public devnet address | P0 |
| `/app` | Funded budget, arithmetic, bills, expected invoices, scenarios | P0 |
| App settings dialog | Reserve, timezone, local-data disclosure and deletion | P0 |
| Not-found page | Return to AfterBills without implying plan loss | P0 |
| Receipt section within `/app` | Verified incoming evidence and invoice allocation | P1 |

Bills and invoices are sections/dialogs in P0, not separate applications or six
different dashboard routes. The expected-payment forecast stays explicitly
separate from the primary funded amount.

## 2. Entry and onboarding

### Landing copy

- Wordmark: **AfterBills**.
- Heading: **Your balance isn't your budget.**
- Description: "See what remains after your bills and buffer, without counting
  invoices you haven't been paid."
- Primary action: **Try a sample plan**.
- Secondary action: **Watch a Solana address**.
- Privacy: "Read-only. No signature or spending access. Address queries go to
  our RPC infrastructure; financial notes stay in this browser."
- Network: "Devnet prototype. Test tokens have no real value."

### Live setup

1. Paste a public address. Validate locally before sending a request.
2. Show a read-only explanation and the fixed devnet/asset identity.
3. Fetch balance. Successful absence of token accounts means zero; failed fetch
   means unknown. Do not insert a fake nonzero balance.
4. Ask for reserve and a first dated bill; allow skipping but label the plan
   incomplete. Store only after validation.
5. Open dashboard with an explicit 14-day date range.

Optional wallet connect is P1 and only supplies the address. No signing prompt,
auto-connect surprise, account authentication claim, or deposit requirement.
Pasting an address does not prove that it belongs to the viewer.

## 3. Desktop dashboard, reference 1440 x 1000

```text
+--------------------------------------------------------------------------+
| AfterBills       Overview      Bills      Expected invoices               |
|                        Devnet / Read-only / 8x..Qp / Refresh              |
+--------------------------------------------------------------------------+
| Plan: Nov 1-14 [14 days]                  Last read: 10:42 / Finalized     |
|                                                                          |
| After bills and reserve                  How this is calculated           |
| 280.00 USDC                              Observed usable balance  1,200   |
| About 20.00/day across 14 days            Included open bills      -770   |
| Based on the commitments you entered.    Your reserve              -150   |
| [Preview a purchase]                     ------------------------------   |
|                                          After bills               280   |
+-----------------------------------------+--------------------------------+
| Upcoming bills                          | Expected invoices              |
| [+ Add bill]                            | Not included in funded amount  |
| Nov 8   Rent                      650   | Nov 6   Client A          800  |
| Nov 10  Utilities/software         120   | Expected, not received [Edit]  |
| [Edit] [Delete]                          | [+ Add invoice]                |
| Bills beyond this window: 1             |                                |
+-----------------------------------------+--------------------------------+
| What if a client pays late?                                               |
| [Expected dates] [7 days later]       Conditional outlook, not cash on hand|
| Accessible timeline and date-by-date text summary                         |
+--------------------------------------------------------------------------+
| Local-only financial notes / Assumptions / Clear this plan                 |
+--------------------------------------------------------------------------+
```

Numbers above are synthetic fixtures, not a live account.

Keep source, observation age, and horizon close to the hero. No ambiguous
"total wealth," "guaranteed safe to spend," or "available credit" labels.

## 4. Mobile composition, reference 390 x 844

```text
+----------------------------------+
| AfterBills        Devnet [Menu]   |
| Read-only / 8x..Qp   [Refresh]    |
| Plan Nov 1-14 / read 10:42        |
|                                  |
| After bills and reserve          |
| 280.00 USDC                      |
| About 20.00/day over 14 days      |
| [Preview a purchase]             |
|                                  |
| How this is calculated           |
| Usable balance          1,200    |
| Bills                    -770    |
| Reserve                  -150    |
| After bills               280    |
|                                  |
| Upcoming bills     [+ Add bill]  |
| Rent / Nov 8 / 650 / [Edit]       |
|                                  |
| Expected invoices                |
| Not included above               |
| Client A / Nov 6 / 800 / [Edit]   |
|                                  |
| Late-payment scenario            |
| [Expected] [7 days late]         |
+----------------------------------+
```

Use cards/rows, not horizontal table scrolling. Forms are full-width dialogs or
dedicated panels with visible labels, keyboard focus management, and scrollable
content. Respect safe-area insets. No fixed bottom control may cover fields.

## 5. Components and interactions

### Calculation hero

- Positive: amount, date horizon, daily planning pace, assumptions link.
- Deficit: "Shortfall: 370.00 USDC", signed breakdown and "Adjust commitments or
  reserve." No positive daily spending suggestion.
- Exact zero: "No room after listed commitments." Not an error.
- Unknown: amount replaced by a clear unavailable state; setup/edit remains usable.
- Frozen accounts: distinguish total observed from usable balance; show frozen
  amount and why it is excluded. Delegation warning means the buffer is not protected.

### Bill editor

Fields: title, amount in supported token, due date. Primary: Save bill.
Inline validation for missing title, zero/negative/too-precise amount, invalid
calendar date. Save once, prevent double submit. Deletion asks "Remove this
commitment from your plan? This does not pay the bill."

Open overdue bills display an Overdue text badge and remain reserved.
Beyond-window bills stay visible as excluded, with their date and explanation.
No "mark paid" button until reconciliation is implemented.

### Reserve editor

Amount including zero, explanation: "A planning buffer. Funds are not locked or
moved." Changing it updates the exact calculation immediately after valid input.
Do not apply partially typed invalid numbers.

### Invoice editor

Fields: client label, invoice amount, expected date. Show "Expected, not received."
Cancel removes future projection, not cash. If optional manual received action
is built, label it "Manually recorded received" and explain that it neither
verifies a blockchain payment nor credits the balance.

### Purchase impact sheet: signature interaction

Fields: purchase amount; optional note may be deferred. Preserve baseline:
"Before: 280.00" / "After a 180.00 purchase: 100.00" / "About 7.14/day."
Show "Preview only. No funds move." Negative result shows shortfall, not approval.
Reset/close discards preview. No "Buy" button or transaction method.

### Conditional outlook

Use funded, expected, and delayed lines with text labels plus solid/dashed/
dotted styles. A reserve threshold is separate from bills. Include a compact
date/value list for screen-reader and nonvisual use.

P0 can use a date-by-date comparison list instead of a chart if time is short.
Required: the two dates and conditional balances are understandable. No graph
library or decorative line is necessary. Announce scenario changes once, not
on every animation frame.

### Settings and data

Timezone visible; 14-day horizon fixed in P0. Explain local storage, shared-device
risk, and infrastructure visibility. Clear the selected profile only after
confirmation. Disconnect/watch-another-address preserves but does not reveal the
previous profile under the new address. Restore profiles only on explicit selection.

## 6. Required states

| State | Visible response | What must not happen |
|---|---|---|
| Sample mode | Persistent "Sample plan / fictional data" banner and fixed example dates | Sample values presented as chain reads |
| Live devnet | Persistent "Devnet / test money" plus actual address and asset | Test token called real dollars |
| First load | Stable skeleton, "Reading balance" and usable navigation | Flash of zero/available money |
| Empty plan | Suggest first bill/reserve and show incompleteness | Claim all obligations are covered |
| RPC timeout/429 | Explain failure, keep timestamped last success as stale, Retry | Replace with zero or silently switch to sample |
| Old response after address change | Ignore it | Cross-wallet display or persisted-data leak |
| Storage unavailable | "Changes won't persist in this browser"; keep in-memory session | False saved confirmation |
| Bad local schema | Offer explicit reset/recovery; preserve original until confirmed | Automatic destructive reset |
| Wallet reject/unavailable, P1 | Retry or use public-address entry | Repeated unsolicited connection prompts |
| Receipt null/failed, P1 | Unverified/pending; no invoice allocation | "Paid" solely because a signature exists |

## 7. Accessibility, craft, and evidence

- WCAG AA contrast, visible focus, explicit input labels and useful error text.
- Logical headings, landmarks, skip link, real buttons and semantic lists/tables.
- Primary touch targets >=44px; layout checked at 390px and 1440px plus 200% zoom.
- Focus enters dialogs and returns to trigger; Escape cancels without data loss.
- Reduced motion keeps everything visible and removes movement.
- Avoid color-only financial states, small low-contrast timestamps, and ticker counters.
- Prefer no third-party images. Wordmark and later OG artwork must not imply
  unavailable features or fake traction.
- UI numbers and explanations must come from the same engine result, never
  separate arithmetic in components.

Actual evidence now covers populated, empty, stale, deficit, purchase, very long
amounts, and scenario states on mobile/desktop; production build, keyboard dialog
walkthroughs, reduced motion, and accessibility scans. See `VALIDATION.md`.
