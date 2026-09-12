/**
 * Ids are random so that two browsers can create things at the same moment without
 * colliding. The prototype minted ids from a shared counter (n12, e13); those ids are
 * kept as-is on import and never reused for new items.
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomChars(n: number): string {
  const out: string[] = [];
  const g = globalThis.crypto;
  if (g && typeof g.getRandomValues === 'function') {
    const bytes = new Uint8Array(n);
    g.getRandomValues(bytes);
    for (let i = 0; i < n; i++) out.push(ALPHABET[bytes[i] % ALPHABET.length]);
  } else {
    for (let i = 0; i < n; i++) out.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
  }
  return out.join('');
}

/** `n_k9x2…` style id for nodes (n), edges (e), characters (ch), cohorts (co), clocks (c). */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${randomChars(5)}`;
}

/** Campaign ids are the whole secret: 20 lowercase alphanumerics (~103 bits). */
export function newCampaignId(): string {
  return randomChars(20);
}

export const CAMPAIGN_ID_RE = /^[a-z0-9]{12,40}$/;
