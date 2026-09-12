import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app configuration.
 *
 * These values are public by design (they identify the project; access is governed by the
 * database rules in docs/firebase-rules.json), so they are committed here.
 *
 * Setup, once:
 *   1. console.firebase.google.com → Add project (Analytics off).
 *   2. Build → Realtime Database → Create database (europe-west1) → start in locked mode.
 *   3. Rules tab → paste docs/firebase-rules.json → Publish.
 *   4. Project settings → Your apps → Web app (</>) → copy the config object below.
 *
 * Leave it `null` to run in local mode (ledger in this browser's localStorage only).
 */
export const firebaseConfig: FirebaseOptions | null = null;
