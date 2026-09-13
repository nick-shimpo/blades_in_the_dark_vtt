/**
 * The store holds one campaign's ledger and tells the UI when it changes.
 *
 * Two implementations share this interface:
 *  - LocalStore: this browser only (localStorage), used when no Firebase config is present.
 *  - FirebaseStore (firebase.ts): the shared, live document.
 *
 * Writes are patches: a map of slash-separated paths (relative to the ledger) to values.
 * `null` deletes. Patches are applied optimistically to the local copy, so the UI never
 * waits for the network.
 */
import { normalizeLedger } from '../ledger/normalize';
import type { Ledger, RollRecord } from '../ledger/types';

export type Patch = Record<string, unknown>;
export type SaveState = 'saved' | 'saving' | 'offline' | 'error' | 'connecting';

export interface StoreStatus {
  state: SaveState;
  at?: number; // last successful save
  live: boolean; // connected to the shared database
  mode: 'local' | 'firebase';
}

export interface Store {
  readonly mode: 'local' | 'firebase';
  readonly campaignId: string;
  /** Called with the current ledger immediately (if known) and on every change. `null` = campaign does not exist yet. */
  subscribe(cb: (ledger: Ledger | null) => void): () => void;
  subscribeStatus(cb: (status: StoreStatus) => void): () => void;
  subscribeRolls(cb: (rolls: RollRecord[]) => void): () => void;
  current(): Ledger | null;
  update(patch: Patch): void;
  replace(ledger: Ledger): void;
  pushRoll(roll: RollRecord): void;
  close(): void;
}

// ---------------------------------------------------------------- patch helpers

function setIn(target: unknown, keys: string[], value: unknown): unknown {
  if (keys.length === 0) return value;
  const [k, ...rest] = keys;
  const base: Record<string, unknown> = target && typeof target === 'object' ? { ...(target as Record<string, unknown>) } : {};
  if (rest.length === 0) {
    if (value === null || value === undefined) delete base[k];
    else base[k] = value;
  } else {
    base[k] = setIn(base[k], rest, value);
  }
  return base;
}

/** Immutable application of a patch to a ledger (paths relative to the ledger root). */
export function applyPatch(ledger: Ledger, patch: Patch): Ledger {
  let out: unknown = ledger;
  for (const [path, value] of Object.entries(patch)) {
    const keys = path.split('/').filter(Boolean);
    if (!keys.length) continue;
    out = setIn(out, keys, value);
  }
  return out as Ledger;
}

/** Firebase rejects `undefined`; strip it (and turn top-level undefined into deletes). */
export function sanitize<T>(value: T): T {
  if (value === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Patch containing only the top-level fields of `after` that differ from `before`. */
export function shallowDiffPatch(basePath: string, before: Record<string, unknown>, after: Record<string, unknown>): Patch {
  const patch: Patch = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const k of keys) {
    const a = JSON.stringify(before?.[k] ?? null);
    const b = JSON.stringify(after?.[k] ?? null);
    if (a !== b) patch[`${basePath}/${k}`] = after?.[k] === undefined ? null : after[k];
  }
  return patch;
}

// ---------------------------------------------------------------- recent campaigns (per browser)

export interface RecentCampaign {
  id: string;
  name: string;
  at: number;
  /** Which link this browser last used for the campaign; 'gm' is remembered once seen. */
  role?: 'gm' | 'player';
}
const RECENT_KEY = 'doskvol-table:recent';

export function recentCampaigns(): RecentCampaign[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as RecentCampaign[]) : [];
    return Array.isArray(list) ? list.filter((r) => r && typeof r.id === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberCampaign(id: string, name: string, role: 'gm' | 'player' = 'player'): void {
  try {
    const prev = recentCampaigns().find((r) => r.id === id);
    const list = recentCampaigns().filter((r) => r.id !== id);
    list.unshift({ id, name, at: Date.now(), role: role === 'gm' || prev?.role === 'gm' ? 'gm' : 'player' });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    /* storage unavailable */
  }
}

export function forgetCampaign(id: string): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentCampaigns().filter((r) => r.id !== id)));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- local store

type Listener<T> = (x: T) => void;

class Emitter<T> {
  private ls = new Set<Listener<T>>();
  on(l: Listener<T>): () => void {
    this.ls.add(l);
    return () => this.ls.delete(l);
  }
  emit(x: T): void {
    for (const l of [...this.ls]) l(x);
  }
}

export class LocalStore implements Store {
  readonly mode = 'local' as const;
  private ledger: Ledger | null;
  private ledgerEv = new Emitter<Ledger | null>();
  private statusEv = new Emitter<StoreStatus>();
  private rollsEv = new Emitter<RollRecord[]>();
  private rolls: RollRecord[] = [];
  private status: StoreStatus = { state: 'saved', live: false, mode: 'local' };
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly campaignId: string) {
    this.ledger = this.read();
  }

  private key() {
    return `doskvol-table:campaign:${this.campaignId}`;
  }
  private read(): Ledger | null {
    try {
      const raw = localStorage.getItem(this.key());
      return raw ? normalizeLedger(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }
  private scheduleSave() {
    this.setStatus({ state: 'saving' });
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 400);
  }
  private flush() {
    this.timer = null;
    if (!this.ledger) return;
    try {
      localStorage.setItem(this.key(), JSON.stringify({ ...this.ledger, savedAt: new Date().toISOString() }));
      this.setStatus({ state: 'saved', at: Date.now() });
    } catch {
      this.setStatus({ state: 'error' });
    }
  }
  private setStatus(p: Partial<StoreStatus>) {
    this.status = { ...this.status, ...p };
    this.statusEv.emit(this.status);
  }

  subscribe(cb: (l: Ledger | null) => void) {
    cb(this.ledger);
    return this.ledgerEv.on(cb);
  }
  subscribeStatus(cb: (s: StoreStatus) => void) {
    cb(this.status);
    return this.statusEv.on(cb);
  }
  subscribeRolls(cb: (r: RollRecord[]) => void) {
    cb(this.rolls);
    return this.rollsEv.on(cb);
  }
  current() {
    return this.ledger;
  }
  update(patch: Patch) {
    if (!this.ledger) return;
    this.ledger = normalizeLedger(applyPatch(this.ledger, sanitize(patch)));
    this.ledgerEv.emit(this.ledger);
    this.scheduleSave();
  }
  replace(ledger: Ledger) {
    this.ledger = normalizeLedger(sanitize(ledger));
    this.ledgerEv.emit(this.ledger);
    this.flush();
  }
  pushRoll(roll: RollRecord) {
    this.rolls = [...this.rolls, roll].slice(-20);
    this.rollsEv.emit(this.rolls);
  }
  close() {
    if (this.timer) this.flush();
  }
}
