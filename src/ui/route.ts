import { useEffect, useState } from 'preact/hooks';
import { CAMPAIGN_ID_RE } from '../ledger/ids';
import type { Role, ViewId } from './context';

export interface Route {
  campaignId: string | null;
  view: ViewId;
  role: Role;
}

/**
 * Hash routes work on GitHub Pages without any server rewrite.
 *   player:  #/c/<id>[/<view>]
 *   GM:      #/gm/<id>[/<view>]
 * The role is nothing more than which prefix was used.
 */
const VIEW_IDS: ViewId[] = ['network', 'play', 'sparks', 'tools', 'sheets'];
/** Segments from the first day of the app, kept so old links still open. */
const LEGACY_VIEWS: Record<string, ViewId> = { table: 'network', scene: 'play' };

export function parseView(seg: string | undefined): ViewId {
  if (!seg) return 'network';
  if ((VIEW_IDS as string[]).includes(seg)) return seg as ViewId;
  return LEGACY_VIEWS[seg] ?? 'network';
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const prefix = parts[0];
  if ((prefix === 'c' || prefix === 'gm') && parts[1] && CAMPAIGN_ID_RE.test(parts[1])) {
    return { campaignId: parts[1], view: parseView(parts[2]), role: prefix === 'gm' ? 'gm' : 'player' };
  }
  return { campaignId: null, view: 'network', role: 'player' };
}

export function hrefFor(campaignId: string, view: ViewId = 'network', role: Role = 'player'): string {
  return `#/${role === 'gm' ? 'gm' : 'c'}/${campaignId}${view === 'network' ? '' : `/${view}`}`;
}

/** Navigate within the campaign, keeping the current role unless one is given. */
export function navigate(campaignId: string | null, view: ViewId = 'network', role?: Role): void {
  if (!campaignId) {
    location.hash = '#/';
    return;
  }
  location.hash = hrefFor(campaignId, view, role ?? parseHash(location.hash).role);
}

export function campaignLink(campaignId: string, role: Role): string {
  return `${location.origin}${location.pathname}${hrefFor(campaignId, 'network', role)}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
