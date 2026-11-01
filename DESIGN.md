# AfterBills design direction

Design direction, 2026-10-31. Implemented as a local prototype. Production-build
desktop/mobile browser checks and screenshots are recorded in `docs/VALIDATION.md`.

## Brief

Audience: freelancers with irregular USDC receipts. Job: explain the difference
between a wallet balance and money remaining after commitments. The first screen
must answer that question without a wallet signature or an AI conversation.

Assumptions: English UI, desktop and 390px mobile, one light theme, USD-style
formatting explicitly labeled USDC, synthetic sample content. A public-address
watch flow is sufficient; wallet connection is an optional shortcut.

## Concept exploration

Scores 1-5; portability lower is better. These are design judgments, not jury scores.

| Territory | Concept and anchor | Signature / emotion / screenshot | O / Fit / Feasibility / Portability |
|---|---|---|---|
| Name | **After the line:** put a boundary between listed commitments and the amount left after them. Anchored in "AfterBills." | Expand a purchase preview below that boundary without altering the original figures; clarity; a screenshot contains both the remainder and its arithmetic. | 4 / 5 / 5 / 2 |
| Time | **Two calendars:** actual cash and expected payment dates occupy distinct timelines. Anchored in uneven client payment timing. | A delayed invoice moves on the conditional timeline while funded cash stays still; preparedness; paired timelines. | 4 / 5 / 3 / 3 |
| User process | **The next decision:** organize the page around a purchase decision, not a financial overview. Anchored in "Can I afford this?" | One purchase opens an impact sheet; agency; before/after purchase amounts. | 3 / 4 / 5 / 3 |

Choose **After the line**. It makes the product's name, arithmetic, layout, and
trust model agree. Borrow only the separate-timeline clarity from the second
concept; do not make a complex calendar the main interface.

## Concept card

```text
Idea:        The amount that matters is what is left after your commitments.
Metaphor:    A clear boundary between committed money and available room.
Signature:   A purchase-impact sheet opens below that boundary, preserving the
             original amount and explicitly showing the new remainder.
Emotion:     Calm, legible, grounded. No excitement about gains or shame about debt.
Motion verb: Settle into place.
Screenshot:  280 USDC after bills, with 1,200 - 770 - 150 visible next to it,
             and 800 expected shown separately as "not included."
```

## Art direction system

### Palette

| Role | Value | Use |
|---|---|---|
| Ground | `#F5F8FA` | Quiet cool background, not cream/editorial. |
| Surface | `#FFFFFF` | Calculation sheet and form surfaces. |
| Ink | `#17252C` | Primary text and large tabular numbers. |
| Muted | `#52636B` | Secondary text with AA contrast to be measured. |
| Line | `#CFD8DC` | Dividers, not the sole boundary of an input. |
| Accent | `#224B8F` | Active controls and the available-money boundary. |

Semantic additions: warning `#805E13` on `#FFF6DB`; deficit `#A33B32` on
`#FFF2F0`; receipt confirmation `#24634D` on `#ECF7F1`.
These are proposed values, not measured contrast results. Inputs needing a
visible boundary should use a darker line (for example `#6C7D86`) and QA must
verify relevant non-text contrast. Never rely on color alone.

### Type

- **Instrument Sans**, Google Fonts/OFL, 400/500/600/700; system sans fallback.
- Same family for interface, headings, and tabular numbers. Avoid decorative serif.
- Desktop hero amount 64-76px, mobile 44-52px; `font-variant-numeric: tabular-nums`.
- H1 28-36px, H2 20-24px, body/forms 16px, metadata 13-14px.
- Body line-height 1.5; large numeric line-height 1.05; slight negative tracking
  only for display amounts/headings. Preserve long amounts without clipping.
- Self-host through the framework or licensed files at implementation time;
  no runtime third-party font dependency. Retain the license.

### Grid and shape

- App max width 1,200px; 12-column desktop grid, 24px gutter.
- Header, main hero, and bill titles share a strong left alignment.
- Hero spans 7 columns; arithmetic sheet spans 5. Below: bills 7, invoices 5.
- At <768px: single column, 20px page padding, no squashed desktop table.
- 8px spacing base; 8/16/24/40/64 rhythm. Keep form groups compact and sections airy.
- Radius 12px for large sheets, 8px controls. No floating glass, gradient blobs,
  giant shadows, speculative crypto charts, mascots, or unnecessary stock imagery.

### Motion and interaction

- Still at rest by design: financial numbers must not look like a live trading ticker.
- No loader theater, scroll-jacking, smooth-scroll interception, or WebGL.
- Button press: 1px settle; focus ring: 2px visible offset; primary hover adds a
  restrained inset/fill treatment and optional 2px icon movement.
- Purchase sheet: 160-220ms transform/opacity, never animate an intermediate
  financial total. Screen readers receive the final total once.
- One ease family, `cubic-bezier(0.2, 0, 0, 1)`. Reduced motion removes transforms.
- No animation library is required for the checkpoint's quiet functional UI.
  Do not add a motion framework merely to mimic award-site presentation.

## Composition

Landing: asymmetric product explanation plus an honest synthetic calculation
figure, then a short privacy/limitations section. No fake testimonials, traction,
awards, screenshots, or "AI-powered" claims.

Dashboard: primary amount and its proof first, dated bills next, uncertain invoices
separate, optional conditional timeline after those. Not a grid of equal KPI cards.

Signature: a real purchase preview opens below the available-money boundary,
showing a before/after delta without modifying the plan or touching funds.

Details, mobile compositions, and error states are specified in
`docs/UI_SPEC.md`.

## Genericness check

Removed generic trading balance cards, pie charts, assistant chat bubbles, and
growth arrows. Kept a distinctive calculation boundary with explicit reservations
and a separate uncertain-invoice lane. The brand comes from the user's decision,
not a purple gradient or borrowed fintech template.

## Implementation and evidence

The cool light palette, self-hosted Instrument Sans, asymmetric landing, visible
calculation boundary, separate uncertain-income lane, and purchase-impact sheet
are implemented. Still at rest remains intentional; no animation library or
decorative motion was added. The uninformative arithmetic-sheet index was removed
during contrast review rather than retaining an accessory.

Core production-browser tests cover desktop/mobile, keyboard dialog focus,
reduced motion, error/stale states, and axe checks. Further audit results and
limitations are recorded in `docs/VALIDATION.md`. No user interviews, production
adoption, official jury score, or actual Safari/device test is claimed.
