"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Bill, Invoice } from "@/contracts/model";
import { ASSET } from "@/contracts/asset";
import { isValidDate, parseUnits } from "@/domain";
import { validOwner } from "@/state/observation";
import { validTimezone } from "@/state/profile-store";
import { PlanDialog } from "./dialog";

type Errors = Record<string, string>;
function inputMoney(units: string): string {
  const value = BigInt(units);
  const decimals = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${value / 1_000_000n}${decimals ? `.${decimals}` : ""}`;
}
function parseAmount(raw: string, allowZero: boolean): string {
  const amount = parseUnits(raw);
  if ((!allowZero && amount === 0n) || amount.toString().length > 78) throw new Error("Enter an amount greater than zero, with up to 6 decimal places.");
  return amount.toString();
}
function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="form-error" role="alert">{message}</p> : null;
}

export function ItemEditor({ kind, item, defaultDate, onSave, onClose }: {
  kind: "bill" | "invoice"; item?: Bill | Invoice; defaultDate: string;
  onSave(value: { label: string; amountUnits: string; date: string }): void; onClose(): void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const submitted = useRef(false);
  const noun = kind === "bill" ? "bill" : "invoice";
  const isBill = kind === "bill";
  const currentLabel = item ? ("title" in item ? item.title : item.clientLabel) : "";
  const currentUnits = item ? ("amountUnits" in item ? item.amountUnits : item.totalUnits) : "";
  const currentDate = item ? ("dueDate" in item ? item.dueDate : item.expectedDate) : defaultDate;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    const data = new FormData(event.currentTarget);
    const label = String(data.get("label") ?? "").trim();
    const date = String(data.get("date") ?? "");
    const nextErrors: Errors = {};
    if (!label || label.length > 120) nextErrors.label = "Enter a name of 1 to 120 characters.";
    if (!isValidDate(date)) nextErrors.date = "Choose a valid calendar date.";
    let amountUnits = "";
    try { amountUnits = parseAmount(String(data.get("amount") ?? ""), false); }
    catch { nextErrors.amount = "Enter a positive amount with no more than 6 decimal places. No commas or exponents."; }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    submitted.current = true;
    onSave({ label, date, amountUnits });
  }
  return <PlanDialog title={`${item ? "Edit" : "Add"} ${noun}`}
    description={isBill ? "Reserve money for a listed commitment. This never pays or moves funds." : "Expected, not received. This invoice affects only your conditional outlook."} onClose={onClose}>
    <form onSubmit={submit} noValidate className="plan-form">
      <div className="field">
        <label htmlFor="item-label">{isBill ? "Bill name" : "Client name"}</label>
        <input className="input" id="item-label" name="label" maxLength={120} defaultValue={currentLabel}
          autoComplete="off" aria-invalid={Boolean(errors.label)} aria-describedby={errors.label ? "label-error" : undefined} />
        <FieldError id="label-error" message={errors.label} />
      </div>
      <div className="field">
        <label htmlFor="item-amount">Amount (USDC)</label>
        <input className="input" id="item-amount" name="amount" inputMode="decimal" type="text"
          placeholder="0.00" defaultValue={currentUnits ? inputMoney(currentUnits) : ""}
          autoComplete="off" aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? "amount-error" : undefined} />
        <FieldError id="amount-error" message={errors.amount} />
      </div>
      <div className="field">
        <label htmlFor="item-date">{isBill ? "Due date" : "Expected payment date"}</label>
        <input className="input" id="item-date" name="date" type="date" defaultValue={currentDate}
          aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? "date-error" : undefined} />
        <FieldError id="date-error" message={errors.date} />
      </div>
      <div className="form-actions">
        <button className="button-secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="button" type="submit">Save {noun}</button>
      </div>
    </form>
  </PlanDialog>;
}

export function SettingsEditor({ reserveUnits, timezone, onSave, onClose }: {
  reserveUnits: string; timezone: string; onSave(reserve: string, timezone: string): void; onClose(): void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const timezoneOptions = [...new Set([timezone, "UTC", "Asia/Kolkata", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", ...Intl.supportedValuesOf("timeZone")])];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const zone = String(data.get("timezone") ?? "").trim();
    const nextErrors: Errors = {};
    let reserve = "";
    try { reserve = parseAmount(String(data.get("reserve") ?? ""), true); }
    catch { nextErrors.reserve = "Enter zero or a positive amount, with up to 6 decimal places."; }
    if (!validTimezone(zone)) nextErrors.timezone = "Choose a valid IANA timezone.";
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) onSave(reserve, zone);
  }
  return <PlanDialog title="Your planning settings" description="Your reserve is a planning buffer. Funds are not locked or moved." onClose={onClose}>
    <form className="plan-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="reserve">Reserve (USDC)</label>
        <input className="input" id="reserve" name="reserve" inputMode="decimal" defaultValue={inputMoney(reserveUnits)}
          aria-invalid={Boolean(errors.reserve)} aria-describedby={errors.reserve ? "reserve-error" : undefined} />
        <FieldError id="reserve-error" message={errors.reserve} />
      </div>
      <div className="field">
        <label htmlFor="timezone">Planning timezone</label>
        <input className="input" id="timezone" name="timezone" list="timezone-options" defaultValue={timezone}
          aria-invalid={Boolean(errors.timezone)} aria-describedby={errors.timezone ? "timezone-error" : undefined} />
        <datalist id="timezone-options">{timezoneOptions.map(zone => <option key={zone} value={zone} />)}</datalist>
        <FieldError id="timezone-error" message={errors.timezone} />
      </div>
      <p className="form-note">Live plans cover 14 calendar days starting today. The sample keeps its fixed reference dates.</p>
      <div className="privacy-note">
        <strong>Stored on this browser, not encrypted.</strong>
        <p>Bill names, invoices, and settings stay in local storage. Anyone using this browser profile can see them. No backup or cross-device sync.</p>
      </div>
      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="button">Save settings</button>
      </div>
    </form>
  </PlanDialog>;
}

export function WatchEditor({ onWatch, onClose }: { onWatch(owner: string): void; onClose(): void }) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const owner = String(new FormData(event.currentTarget).get("owner") ?? "").trim();
    if (!validOwner(owner)) { setError("Enter a valid base58 Solana public address. Never enter a private key or seed phrase."); return; }
    onWatch(owner);
  }
  return <PlanDialog title="Watch a Solana address" description="Read-only. No connection, signature, or spending access. Pasting an address does not prove ownership." onClose={onClose}>
    <form className="plan-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="watch-owner">Public wallet address</label>
        <input className="input address-input" id="watch-owner" name="owner" placeholder="Paste a public address"
          spellCheck={false} autoComplete="off" maxLength={44} aria-invalid={Boolean(error)}
          aria-describedby={error ? "watch-error" : "watch-privacy"} />
        <FieldError id="watch-error" message={error} />
      </div>
      <p className="form-note" id="watch-privacy">The public address goes to our server and Solana RPC provider. Your financial notes do not.</p>
      <div className="privacy-note">
        <strong>Devnet only. Test tokens have no real value.</strong>
        <p>Supported mint: <span className="break-address">{ASSET.mint}</span></p>
        <p>A successful read may show zero. A failed read stays unavailable, never zero.</p>
      </div>
      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="button">Read devnet balance</button>
      </div>
    </form>
  </PlanDialog>;
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onClose }: {
  title: string; description: string; confirmLabel: string; onConfirm(): void; onClose(): void;
}) {
  return <PlanDialog title={title} description={description} onClose={onClose}>
    <div className="form-actions">
      <button type="button" className="button-secondary" onClick={onClose}>Keep it</button>
      <button type="button" className="button button-danger" onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </PlanDialog>;
}
