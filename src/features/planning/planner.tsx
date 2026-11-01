"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SAMPLE_PROFILE_KEY, STALE_AFTER_MS, liveProfileKey } from "@/contracts/asset";
import type { Bill, Invoice, Mode, Observation, Plan } from "@/contracts/model";
import type { DashboardActions } from "@/contracts/view-model";
import { createSamplePlan } from "@/fixtures/sample";
import { Dashboard } from "@/features/dashboard/dashboard";
import {
  ACTIVE_OWNER_KEY, clearPlan, createLivePlan, loadPlan, reanchorPlan, savePlan,
  type StoragePort, type StorageStatus
} from "@/state/profile-store";
import { acceptSnapshot, ageObservation, fetchSnapshot, validOwner } from "@/state/observation";
import { toDashboardModel } from "@/state/selectors";
import { ConfirmDialog, ItemEditor, SettingsEditor, WatchEditor } from "./editors";

interface ProfileState { mode: Mode; owner?: string; plan?: Plan; storageStatus: StorageStatus }
type Editor =
  | { kind: "bill"; item?: Bill }
  | { kind: "invoice"; item?: Invoice }
  | { kind: "settings" | "watch" }
  | { kind: "delete-bill" | "cancel-invoice"; id: string }
  | { kind: "clear" | "reset" };

function browserStorage(): StoragePort | undefined {
  try { return window.localStorage; } catch { return undefined; }
}
function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
function initializeProfile(mode: Mode, owner?: string): ProfileState {
  const key = mode === "sample" ? SAMPLE_PROFILE_KEY : liveProfileKey(owner ?? "unselected");
  const storage = browserStorage();
  const loaded = mode === "sample" || owner ? loadPlan(key, storage) : { status: storage ? "empty" as const : "unavailable" as const };
  const base = loaded.plan ?? (mode === "sample" ? createSamplePlan() : createLivePlan(owner ?? "unselected", localTimezone(), new Date()));
  return { mode, owner, plan: reanchorPlan(base, new Date()), storageStatus: loaded.status };
}

export function Planner({ initialMode }: { initialMode: Mode }) {
  const [profile, setProfile] = useState<ProfileState>({ mode: initialMode, storageStatus: "empty" });
  const [observation, setObservation] = useState<Observation>({ status: "idle", requestKey: "" });
  const [editor, setEditor] = useState<Editor>();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseInput, setPurchaseInput] = useState("");
  const [scenarioDelay, setScenarioDelay] = useState<0 | 7>(0);
  const request = useRef<{ nonce: number; controller?: AbortController }>({ nonce: 0 });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      let owner: string | undefined;
      if (initialMode === "live") {
        try {
          const saved = browserStorage()?.getItem(ACTIVE_OWNER_KEY);
          if (saved && validOwner(saved)) owner = saved;
        } catch { /* A blocked browser store is reported by initializeProfile. */ }
      }
      setProfile(initializeProfile(initialMode, owner));
      setEditor(initialMode === "live" && !owner ? { kind: "watch" } : undefined);
      setPurchaseOpen(false);
      setPurchaseInput("");
    });
    return () => { cancelled = true; };
  }, [initialMode]);

  const refresh = useCallback(async () => {
    if (profile.mode !== "live" || !profile.owner || !profile.plan) return;
    const owner = profile.owner;
    const key = profile.plan.profileKey;
    request.current.controller?.abort();
    const controller = new AbortController();
    const nonce = ++request.current.nonce;
    request.current.controller = controller;
    const previousSlot = observation.requestKey === key ? observation.lastSuccess?.slot : undefined;
    setObservation(previous => {
      const same = previous.requestKey === key;
      return { status: "loading", requestKey: key, lastSuccess: same ? previous.lastSuccess : undefined };
    });
    const timeout = setTimeout(() => controller.abort(new Error("Balance read timed out.")), 12_000);
    try {
      const snapshot = await fetchSnapshot(owner, controller.signal, previousSlot);
      if (nonce !== request.current.nonce || controller.signal.aborted) return;
      setObservation(previous => ageObservation(acceptSnapshot(previous, snapshot, key), Date.now()));
    } catch (error) {
      if (nonce !== request.current.nonce) return;
      const message = error instanceof Error && !controller.signal.aborted
        ? error.message : "The balance read timed out. Please retry.";
      setObservation(previous => previous.requestKey !== key ? previous : {
        ...previous, status: previous.lastSuccess ? "stale" : "error", errorCode: message
      });
    } finally { clearTimeout(timeout); }
  }, [profile.mode, profile.owner, profile.plan, observation]);

  const currentKey = profile.plan?.profileKey;
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => {
    if (!currentKey || profile.mode !== "live" || !profile.owner) return;
    let cancelled = false;
    const requestState = request.current;
    queueMicrotask(() => { if (!cancelled) void refreshRef.current(); });
    return () => {
      cancelled = true;
      ++requestState.nonce;
      requestState.controller?.abort();
    };
  }, [currentKey, profile.mode, profile.owner]);

  useEffect(() => {
    const update = () => {
      setObservation(previous => ageObservation(previous, Date.now()));
      setProfile(previous => {
        if (!previous.plan) return previous;
        const next = reanchorPlan(previous.plan, new Date());
        return next === previous.plan ? previous : { ...previous, plan: next };
      });
    };
    const timer = setInterval(update, 10_000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const observedAt = observation.lastSuccess?.observedAt;
  useEffect(() => {
    if (!observedAt || observation.status !== "fresh") return;
    const remaining = Math.max(0, Date.parse(observedAt) + STALE_AFTER_MS - Date.now());
    const timer = setTimeout(() => {
      setObservation(previous => ageObservation(previous, Date.now()));
    }, remaining);
    return () => clearTimeout(timer);
  }, [observedAt, observation.status]);

  const commitPlan = (next: Plan) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    const saved = profile.storageStatus !== "corrupt" && savePlan(updated, browserStorage());
    setProfile({ ...profile, plan: updated, storageStatus: profile.storageStatus === "corrupt" ? "corrupt" : saved ? "ok" : "unavailable" });
    setEditor(undefined);
  };
  const watch = (owner: string) => {
    ++request.current.nonce;
    request.current.controller?.abort();
    const next = initializeProfile("live", owner);
    try { browserStorage()?.setItem(ACTIVE_OWNER_KEY, owner); } catch { next.storageStatus = "unavailable"; }
    setProfile(next);
    setObservation({ status: "idle", requestKey: next.plan!.profileKey });
    setEditor(undefined);
    setPurchaseOpen(false);
    setPurchaseInput("");
    window.history.replaceState(null, "", "/app?mode=live");
  };
  const storageWarning = profile.storageStatus === "corrupt"
    ? "Your saved plan has an invalid format. The original is preserved. Changes stay in this session until you explicitly clear this profile."
    : profile.storageStatus === "unavailable" ? "Changes won't persist in this browser. You can keep planning for this session." : undefined;
  const model = useMemo(() => profile.plan ? toDashboardModel({
    plan: profile.plan, mode: profile.mode, owner: profile.owner, observation,
    storageWarning, purchaseOpen, purchaseInput, scenarioDelay
  }) : undefined, [profile.plan, profile.mode, profile.owner, observation, storageWarning, purchaseOpen, purchaseInput, scenarioDelay]);

  if (!profile.plan || !model) return <main id="main" className="boot-state"><h1>AfterBills</h1><p>Opening your local plan…</p></main>;
  const plan = profile.plan;
  const actions: DashboardActions = {
    onAddBill: () => setEditor({ kind: "bill" }),
    onEditBill: id => setEditor({ kind: "bill", item: plan.bills.find(item => item.id === id) }),
    onDeleteBill: id => setEditor({ kind: "delete-bill", id }),
    onAddInvoice: () => setEditor({ kind: "invoice" }),
    onEditInvoice: id => setEditor({ kind: "invoice", item: plan.invoices.find(item => item.id === id) }),
    onCancelInvoice: id => setEditor({ kind: "cancel-invoice", id }),
    onOpenPurchase: () => setPurchaseOpen(true),
    onClosePurchase: () => { setPurchaseOpen(false); setPurchaseInput(""); },
    onPurchaseInputChange: setPurchaseInput,
    onOpenSettings: () => setEditor({ kind: "settings" }),
    onRefresh: () => { void refresh(); },
    onScenarioChange: setScenarioDelay,
    onWatchAddress: () => setEditor({ kind: "watch" }),
    onResetSample: () => { if (profile.mode === "sample") setEditor({ kind: "reset" }); },
    onClearPlan: () => setEditor({ kind: "clear" })
  };
  const close = () => setEditor(undefined);
  return <>
    <Dashboard model={model} actions={actions} />
    {editor?.kind === "bill" && <ItemEditor key={editor.item?.id ?? "new-bill"} kind="bill" item={editor.item} defaultDate={plan.window.startDate}
      onClose={close} onSave={value => {
        const bill: Bill = { id: editor.item?.id ?? crypto.randomUUID(), title: value.label, amountUnits: value.amountUnits, dueDate: value.date };
        commitPlan({ ...plan, bills: editor.item ? plan.bills.map(item => item.id === bill.id ? bill : item) : [...plan.bills, bill] });
      }} />}
    {editor?.kind === "invoice" && <ItemEditor key={editor.item?.id ?? "new-invoice"} kind="invoice" item={editor.item} defaultDate={plan.window.startDate}
      onClose={close} onSave={value => {
        const invoice: Invoice = {
          id: editor.item?.id ?? crypto.randomUUID(), clientLabel: value.label, totalUnits: value.amountUnits,
          expectedDate: value.date, status: editor.item?.status ?? "expected"
        };
        commitPlan({ ...plan, invoices: editor.item ? plan.invoices.map(item => item.id === invoice.id ? invoice : item) : [...plan.invoices, invoice] });
      }} />}
    {editor?.kind === "settings" && <SettingsEditor reserveUnits={plan.reserveUnits} timezone={plan.window.timezone}
      onClose={close} onSave={(reserveUnits, timezone) => commitPlan(reanchorPlan({ ...plan, reserveUnits }, new Date(), timezone))} />}
    {editor?.kind === "watch" && <WatchEditor onWatch={watch} onClose={close} />}
    {editor?.kind === "delete-bill" && <ConfirmDialog title="Remove this commitment?"
      description="Only remove it if it is no longer owed. Removing it from your plan does not pay the bill or prove payment."
      confirmLabel="Remove bill" onClose={close} onConfirm={() => commitPlan({ ...plan, bills: plan.bills.filter(item => item.id !== editor.id) })} />}
    {editor?.kind === "cancel-invoice" && <ConfirmDialog title="Cancel this expected invoice?"
      description="This removes its conditional income from the outlook. It never changes your observed balance or records a payment."
      confirmLabel="Cancel invoice" onClose={close} onConfirm={() => commitPlan({
        ...plan, invoices: plan.invoices.map(item => item.id === editor.id ? { ...item, status: "cancelled" } : item)
      })} />}
    {editor?.kind === "reset" && <ConfirmDialog title="Reset the sample plan?"
      description="Restore the fictional reference example. Only sample changes are replaced; live profiles stay untouched."
      confirmLabel="Reset sample" onClose={close} onConfirm={() => commitPlan(createSamplePlan())} />}
    {editor?.kind === "clear" && <ConfirmDialog title="Clear this local plan?"
      description="Delete only this profile's saved bills, invoices, and reserve from this browser. Other wallet profiles stay untouched. This cannot be undone."
      confirmLabel="Clear this plan" onClose={close} onConfirm={() => {
        const cleared = clearPlan(plan.profileKey, browserStorage());
        const empty: Plan = { ...plan, bills: [], invoices: [], reserveUnits: "0", updatedAt: new Date().toISOString() };
        setProfile({ ...profile, plan: empty, storageStatus: cleared ? "empty" : "unavailable" });
        setEditor(undefined);
        setPurchaseOpen(false);
        setPurchaseInput("");
      }} />}
  </>;
}
