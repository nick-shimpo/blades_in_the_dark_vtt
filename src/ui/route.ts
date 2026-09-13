import { useEffect, useState } from 'preact/hooks';
import { CAMPAIGN_ID_RE } from '../ledger/ids';
import type { ViewId } from './context';

export interface Route {
  campaignId: string | null;
  view: ViewId;
}

/** Hash routes work on GitHub Pages without any server rewrite: `#/c/<id>/<view>`. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'c' && parts[1] && CAMPAIGN_ID_RE.test(parts[1])) {
    const v = parts[2];
    const view: ViewId = v === 'sheets' || v === 'sparks' || v === 'play' || v === 'scene' ? v : 'table';
    return { campaignId: parts[1], view };
  }
  return { campaignId: null, view: 'table' };
}

export function hrefFor(campaignId: string, view: ViewId = 'table'): string {
  return `#/c/${campaignId}${view === 'table' ? '' : `/${view}`}`;
}

export function navigate(campaignId: string | null, view: ViewId = 'table'): void {
  location.hash = campaignId ? hrefFor(campaignId, view) : '#/';
}

export function campaignLink(campaignId: string): string {
  return `${location.origin}${location.pathname}${hrefFor(campaignId)}`;
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
