import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ASSET } from "../../src/contracts/asset";

const publicAddress = "11111111111111111111111111111111";
const anotherAddress = ASSET.mint;
const fixedTime = "2026-11-01T00:00:00.000Z";
const mockedSnapshot = (owner = publicAddress, units = "1200000000") => ({
  owner, network: "devnet", mint: ASSET.mint, decimals: 6,
  usableBalanceUnits: units, totalBalanceUnits: units, frozenUnits: "0",
  slot: 100, observedAt: fixedTime, delegatedWarning: false
});
async function sample(page: Page) {
  await page.goto("/app?mode=sample");
  await expect(page.getByRole("heading", { name: /after bills and reserve/i })).toBeVisible();
}
async function watch(page: Page, owner = publicAddress) {
  await page.getByRole("button", { name: /watch.*address|change address/i }).first().click();
  await page.getByLabel("Public wallet address").fill(owner);
  await page.getByRole("button", { name: "Read devnet balance" }).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("landing, sample, purchase baseline, delay, keyboard and accessible layout", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/balance.*budget/i);
  await noOverflow(page);
  await expect(page.getByRole("link", { name: /try.*sample/i }).first()).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const landingAudit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(landingAudit.violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("landing.png"), fullPage: true });
  await page.getByRole("link", { name: /try.*sample/i }).first().click();
  await expect(page.getByText("280.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/fictional/i).first()).toBeVisible();
  await page.getByRole("button", { name: /preview.*purchase/i }).click();
  await page.getByLabel(/purchase amount/i).fill("180");
  await expect(page.getByText("100.00 USDC", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/7\.14/).first()).toBeVisible();
  await expect(page.getByText("280.00", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: info.outputPath("purchase.png"), fullPage: true });
  await page.getByRole("button", { name: /7 days|7-day|7 day/i }).first().click();
  await expect(page.getByText("280.00", { exact: true }).first()).toBeVisible();
  await noOverflow(page);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.screenshot({ path: info.outputPath("reduced-motion.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("bills, invoices, reserve, shortfall, persistence and dialogs", async ({ page }, info) => {
  await sample(page);
  await page.getByRole("button", { name: /add bill/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Save bill" }).click();
  await expect(page.getByText("Enter a name of 1 to 120 characters.")).toBeVisible();
  await dialog.getByLabel("Bill name").fill("Test workspace");
  await dialog.getByLabel("Amount (USDC)").fill("50");
  await dialog.getByLabel("Due date").fill("2026-11-04");
  await dialog.getByRole("button", { name: "Save bill" }).click();
  await expect(page.getByText("230.00", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Test workspace", { exact: true })).toBeVisible();
  await expect(page.getByText("230.00", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /add invoice/i }).click();
  await page.getByLabel("Client name").fill("Future client");
  await page.getByLabel("Amount (USDC)").fill("999");
  await page.getByLabel("Expected payment date").fill("2026-11-05");
  await page.getByRole("button", { name: "Save invoice" }).click();
  await expect(page.getByText("230.00", { exact: true }).first()).toBeVisible();
  const settings = page.getByRole("button", { name: /settings|edit reserve|adjust reserve/i }).first();
  await settings.click();
  await page.getByLabel("Reserve (USDC)").fill("1000");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("620.00 USDC", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/shortfall/i).first()).toBeVisible();
  await page.screenshot({ path: info.outputPath("shortfall.png"), fullPage: true });
  await page.getByRole("button", { name: /add bill/i }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add bill/i })).toBeFocused();
  await noOverflow(page);
});

test("live response, failure is stale not zero, profile isolation and clear", async ({ page }, info) => {
  await page.clock.install({ time: new Date(fixedTime) });
  let fail = false;
  const sentBodies: Array<Record<string, unknown>> = [];
  await page.route("**/api/solana/snapshot", async route => {
    const body = route.request().postDataJSON() as { owner: string };
    sentBodies.push(body);
    await route.fulfill({
      status: fail ? 502 : 200,
      contentType: "application/json",
      body: JSON.stringify(fail ? { error: { code: "UPSTREAM_UNAVAILABLE", message: "Unavailable" } } : mockedSnapshot(body.owner))
    });
  });
  await sample(page);
  await watch(page);
  await expect(page.getByText("1,200.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/finalized at/i)).toBeVisible();
  await page.getByRole("button", { name: /add bill/i }).click();
  await page.getByLabel("Bill name").fill("Private live bill");
  await page.getByLabel("Amount (USDC)").fill("100");
  await page.getByLabel("Due date").fill("2026-11-02");
  await page.getByRole("button", { name: "Save bill" }).click();
  await expect(page.getByText("1,100.00", { exact: true }).first()).toBeVisible();
  fail = true;
  await page.getByRole("button", { name: /refresh/i }).first().click();
  await expect(page.getByText(/unavailable.*retry/i)).toBeVisible();
  await expect(page.getByText("1,100.00", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: info.outputPath("stale.png"), fullPage: true });
  fail = false;
  await watch(page, anotherAddress);
  await expect(page.getByText("1,200.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Private live bill")).toHaveCount(0);
  await page.goto("/app?mode=sample");
  await expect(page.getByText("280.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Private live bill")).toHaveCount(0);
  expect(sentBodies.length).toBeGreaterThan(0);
  expect(sentBodies.every(body => Object.keys(body).every(key => key === "owner" || key === "minContextSlot"))).toBe(true);
  await noOverflow(page);
});

test("unknown balance, storage denial, empty and zero states remain honest", async ({ page }, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  });
  await page.route("**/api/solana/snapshot", route => route.fulfill({
    status: 502, contentType: "application/json", body: JSON.stringify({ error: { code: "UPSTREAM_UNAVAILABLE" } })
  }));
  await sample(page);
  await expect(page.getByText(/won't persist/i)).toBeVisible();
  await watch(page);
  await expect(page.getByText(/unavailable/i).first()).toBeVisible();
  await expect(page.getByText("0.00", { exact: true }).first()).toBeVisible(); // reserve/bills, not a fake balance
  await page.screenshot({ path: info.outputPath("unknown-empty.png"), fullPage: true });
  await noOverflow(page);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
});

test("true zero, tiny shortfall, excluded bills, cancellation and selected-profile clear", async ({ page }, info) => {
  await page.clock.install({ time: new Date(fixedTime) });
  await page.route("**/api/solana/snapshot", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(mockedSnapshot(publicAddress, "0"))
  }));
  await sample(page);
  await watch(page);
  await expect(page.getByText("No room after listed commitments.")).toBeVisible();
  await expect(page.getByText(/plan is incomplete/i)).toBeVisible();
  await page.getByRole("button", { name: "Add bill", exact: true }).click();
  await page.getByLabel("Bill name").fill("Overdue micro bill");
  await page.getByLabel("Amount (USDC)").fill("0.000001");
  await page.getByLabel("Due date").fill("2026-10-30");
  await page.getByRole("button", { name: "Save bill" }).click();
  await expect(page.getByRole("region", { name: "Shortfall after bills and reserve" }).getByText("0.01 USDC", { exact: true })).toBeVisible();
  await expect(page.getByText("Overdue · included")).toBeVisible();
  await page.getByRole("button", { name: "Add bill", exact: true }).click();
  await page.getByLabel("Bill name").fill("Beyond this window");
  await page.getByLabel("Amount (USDC)").fill("999");
  await page.getByLabel("Due date").fill("2026-11-15");
  await page.getByRole("button", { name: "Save bill" }).click();
  await expect(page.getByText("Outside window · not deducted")).toBeVisible();
  await page.getByText("Inspect exact token units", { exact: true }).click();
  await expect(page.locator(".exact-units")).toContainText("-1");
  await page.getByRole("button", { name: "Add invoice", exact: true }).click();
  await page.getByLabel("Client name").fill("Maybe later");
  await page.getByLabel("Amount (USDC)").fill("800");
  await page.getByLabel("Expected payment date").fill("2026-11-06");
  await page.getByRole("button", { name: "Save invoice" }).click();
  await page.getByRole("button", { name: "Cancel invoice: Maybe later" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel invoice", exact: true }).click();
  await expect(page.getByText("Cancelled · not projected")).toBeVisible();
  await page.getByRole("button", { name: "Clear this plan", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Clear this plan", exact: true }).click();
  await expect(page.getByText("No room after listed commitments.")).toBeVisible();
  await expect(page.getByText("Overdue micro bill")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("No room after listed commitments.")).toBeVisible();
  await expect(page.getByText("Maybe later")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("zero-empty.png"), fullPage: true });
});

test("late responses cannot overwrite a new wallet profile", async ({ page }) => {
  await page.clock.install({ time: new Date(fixedTime) });
  let release!: () => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/solana/snapshot", async route => {
    const body = route.request().postDataJSON() as { owner: string };
    if (body.owner === publicAddress) { started(); await held; }
    try {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(mockedSnapshot(body.owner, body.owner === publicAddress ? "99999000000" : "500000000")) });
    } catch { /* The obsolete request is expected to be aborted. */ }
  });
  await sample(page);
  await watch(page);
  await ready;
  await watch(page, anotherAddress);
  await expect(page.getByText("500.00", { exact: true }).first()).toBeVisible();
  release();
  await expect(page.getByText("99,999.00", { exact: true })).toHaveCount(0);
  await expect(page.getByText("500.00", { exact: true }).first()).toBeVisible();
});

test("stale clock and midnight rollover never trigger an automatic balance credit", async ({ page }, info) => {
  const lateTime = "2026-11-01T23:59:30.000Z";
  await page.clock.install({ time: new Date(lateTime) });
  await page.clock.pauseAt(new Date("2026-11-01T23:59:31.000Z"));
  let requests = 0;
  await page.route("**/api/solana/snapshot", route => {
    requests++;
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ ...mockedSnapshot(), observedAt: lateTime }) });
  });
  await sample(page);
  await watch(page);
  await expect(page.getByText("1,200.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Nov 1 to Nov 14, 2026", { exact: false }).first()).toBeVisible();
  await page.clock.fastForward(58_999);
  await expect(page.getByText(/stale reference only/i)).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(page.getByText(/stale reference only/i)).toBeVisible();
  await expect(page.getByText("Nov 2 to Nov 15, 2026", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("1,200.00", { exact: true }).first()).toBeVisible();
  expect(requests).toBe(1);
  await page.screenshot({ path: info.outputPath("midnight-stale.png"), fullPage: true });
});

test("corrupt local data stays preserved until explicit recovery", async ({ page }) => {
  const key = `afterbills:v1:sample:devnet:${ASSET.mint}:fictional`;
  await page.addInitScript(({ key }) => { localStorage.setItem(key, "{invalid original"); }, { key });
  await sample(page);
  await expect(page.getByText(/original is preserved/i)).toBeVisible();
  await page.getByRole("button", { name: "Add bill", exact: true }).click();
  await page.getByLabel("Bill name").fill("Session only");
  await page.getByLabel("Amount (USDC)").fill("1");
  await page.getByLabel("Due date").fill("2026-11-02");
  await page.getByRole("button", { name: "Save bill" }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe("{invalid original");
  await page.getByRole("button", { name: "Clear this plan", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Clear this plan", exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  await expect(page.getByText(/original is preserved/i)).toHaveCount(0);
});

test("large exact amounts fit and settings dialogs remain accessible by keyboard", async ({ page }, info) => {
  await sample(page);
  await page.getByRole("button", { name: "Open plan settings" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
  }
  const audit = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("settings-dialog.png"), fullPage: true });
  await page.getByLabel("Reserve (USDC)").fill("9007199254740993123456789.123456");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("heading", { name: "Shortfall after bills and reserve" })).toBeVisible();
  await noOverflow(page);
  await page.getByText("Inspect exact token units", { exact: true }).click();
  await expect(page.locator(".exact-units")).toContainText("9007199254740993123456789123456");
  await page.screenshot({ path: info.outputPath("large-exact-amount.png"), fullPage: true });
  if (info.project.name === "desktop") {
    const target = await page.getByRole("link", { name: "Bills", exact: true }).boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(44);
    expect(target?.height).toBeGreaterThanOrEqual(44);
  }
});
