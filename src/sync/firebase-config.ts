import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app configuration.
 *
 * These values are public by design (they identify the project; access is governed by the
 * database rules in docs/firebase-rules.json), so they are committed here.
 *
 * Set to `null` to run in local mode (ledger in this browser's localStorage only).
 */
export const firebaseConfig: FirebaseOptions | null = {
  apiKey: 'AIzaSyBUZgqPuQ5Nvcj_GLfeBerMfXWJaLV4ANA',
  authDomain: 'gen-lang-client-0434487066.firebaseapp.com',
  databaseURL: 'https://gen-lang-client-0434487066-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'gen-lang-client-0434487066',
  storageBucket: 'gen-lang-client-0434487066.firebasestorage.app',
  messagingSenderId: '345816963266',
  appId: '1:345816963266:web:3d7ae714d5ba297788835b',
};
