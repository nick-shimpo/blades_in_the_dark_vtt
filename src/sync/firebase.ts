/**
 * Firebase Realtime Database store: the shared, live campaign document.
 *
 * Layout in the database:
 *   campaigns/<id>/ledger   the ledger (same shape as the app's Ledger type)
 *   campaigns/<id>/rolls    a rolling list of recent dice results (not part of the ledger)
 */
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, limitToLast, onValue, push, query, ref, set, update, type Database, type Unsubscribe } from 'firebase/database';
import { normalizeLedger } from '../ledger/normalize';
import type { Ledger, RollRecord } from '../ledger/types';
import { firebaseConfig } from './firebase-config';
import { applyPatch, sanitize, type Patch, type Store, type StoreStatus } from './store';

export function firebaseAvailable(): boolean {
  return !!firebaseConfig;
}

let app: FirebaseApp | null = null;
let db: Database | null = null;

function database(): Database {
  if (!firebaseConfig) throw new Error('Firebase is not configured');
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  if (!db) db = getDatabase(app);
  return db;
}

type Listener<T> = (x: T) => void;

export class FirebaseStore implements Store {
  readonly mode = 'firebase' as const;
  private ledger: Ledger | null = null;
  private known = false; // first snapshot received
  private ledgerLs = new Set<Listener<Ledger | null>>();
  private statusLs = new Set<Listener<StoreStatus>>();
  private rollsLs = new Set<Listener<RollRecord[]>>();
  private rolls: RollRecord[] = [];
  private status: StoreStatus = { state: 'connecting', live: false, mode: 'firebase' };
  private unsubs: Unsubscribe[] = [];
  private pending = 0;

  constructor(readonly campaignId: string) {
    const d = database();
    this.unsubs.push(
      onValue(
        ref(d, `campaigns/${campaignId}/ledger`),
        (snap) => {
          const val = snap.val();
          this.ledger = val ? normalizeLedger(val) : null;
          this.known = true;
          this.emitLedger();
        },
        () => this.setStatus({ state: 'error' }),
      ),
    );
    this.unsubs.push(
      onValue(query(ref(d, `campaigns/${campaignId}/rolls`), limitToLast(20)), (snap) => {
        const list: RollRecord[] = [];
        snap.forEach((child) => {
          const v = child.val() as RollRecord;
          if (v && Array.isArray(v.dice)) list.push({ ...v, id: child.key ?? v.id });
        });
        this.rolls = list.sort((a, b) => a.at - b.at);
        for (const l of [...this.rollsLs]) l(this.rolls);
      }),
    );
    this.unsubs.push(
      onValue(ref(d, '.info/connected'), (snap) => {
        const live = snap.val() === true;
        this.setStatus({ live, state: live ? (this.pending ? 'saving' : 'saved') : 'offline' });
      }),
    );
  }

  private emitLedger() {
    for (const l of [...this.ledgerLs]) l(this.ledger);
  }
  private setStatus(p: Partial<StoreStatus>) {
    this.status = { ...this.status, ...p };
    for (const l of [...this.statusLs]) l(this.status);
  }
  private track(p: Promise<unknown>) {
    this.pending++;
    this.setStatus({ state: 'saving' });
    p.then(
      () => {
        this.pending--;
        if (this.pending === 0) this.setStatus({ state: this.status.live ? 'saved' : 'offline', at: Date.now() });
      },
      () => {
        this.pending--;
        this.setStatus({ state: 'error' });
      },
    );
  }

  subscribe(cb: (l: Ledger | null) => void) {
    if (this.known) cb(this.ledger);
    this.ledgerLs.add(cb);
    return () => this.ledgerLs.delete(cb);
  }
  subscribeStatus(cb: (s: StoreStatus) => void) {
    cb(this.status);
    this.statusLs.add(cb);
    return () => this.statusLs.delete(cb);
  }
  subscribeRolls(cb: (r: RollRecord[]) => void) {
    cb(this.rolls);
    this.rollsLs.add(cb);
    return () => this.rollsLs.delete(cb);
  }
  current() {
    return this.ledger;
  }
  update(patch: Patch) {
    if (!this.ledger) return;
    const clean = sanitize(patch);
    this.ledger = normalizeLedger(applyPatch(this.ledger, clean));
    this.emitLedger();
    this.track(update(ref(database(), `campaigns/${this.campaignId}/ledger`), clean));
  }
  replace(ledger: Ledger) {
    const clean = sanitize({ ...ledger, savedAt: new Date().toISOString() });
    this.ledger = normalizeLedger(clean);
    this.known = true;
    this.emitLedger();
    this.track(set(ref(database(), `campaigns/${this.campaignId}/ledger`), clean));
  }
  pushRoll(roll: RollRecord) {
    const r = push(ref(database(), `campaigns/${this.campaignId}/rolls`));
    void set(r, sanitize({ ...roll, id: r.key ?? roll.id }));
  }
  close() {
    for (const u of this.unsubs) u();
    this.unsubs = [];
  }
}
