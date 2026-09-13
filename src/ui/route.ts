import { useEffect, useState } from 'preact/hooks';
import { CAMPAIGN_ID_RE } from '../ledger/ids';
import { DEFAULT_VIEW, VIEWS, type Role, type ViewId } from './context';

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
const VIEW_IDS: ViewId[] = VIEWS.map((v) => v.id);
/** Segments from the first day of the app, kept so old links still open. */
const LEGACY_VIEWS: Record<string, ViewId> = { table: 'network', scene: 'play' };

export function parseView(seg: string | undefined, role: Role = 'player'): ViewId {
  let view: ViewId = DEFAULT_VIEW;
  if (seg && (VIEW_IDS as string[]).includes(seg)) view = seg as ViewId;
  else if (seg && LEGACY_VIEWS[seg]) view = LEGACY_VIEWS[seg];
  const def = VIEWS.find((v) => v.id === view);
  return def?.gmOnly && role !== 'gm' ? DEFAULT_VIEW : view;
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const prefix = parts[0];
  if ((prefix === 'c' || prefix === 'gm') && parts[1] && CAMPAIGN_ID_RE.test(parts[1])) {
    const role: Role = prefix === 'gm' ? 'gm' : 'player';
    return { campaignId: parts[1], view: parseView(parts[2], role), role };
  }
  return { campaignId: null, view: DEFAULT_VIEW, role: 'player' };
}

export function hrefFor(campaignId: string, view: ViewId = DEFAULT_VIEW, role: Role = 'player'): string {
  return `#/${role === 'gm' ? 'gm' : 'c'}/${campaignId}${view === DEFAULT_VIEW ? '' : `/${view}`}`;
}

/** Navigate within the campaign, keeping the current role unless one is given. */
export function navigate(campaignId: string | null, view: ViewId = DEFAULT_VIEW, role?: Role): void {
  if (!campaignId) {
    location.hash = '#/';
    return;
  }
  location.hash = hrefFor(campaignId, view, role ?? parseHash(location.hash).role);
}

export function campaignLink(campaignId: string, role: Role): string {
  return `${location.origin}${location.pathname}${hrefFor(campaignId, DEFAULT_VIEW, role)}`;
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
