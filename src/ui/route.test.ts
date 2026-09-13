import { describe, expect, it } from 'vitest';
import { hrefFor, parseHash, parseView } from './route';

const ID = 'abcdefghij0123456789';

describe('routes', () => {
  it('player and GM prefixes decide the role', () => {
    expect(parseHash(`#/c/${ID}`)).toEqual({ campaignId: ID, view: 'network', role: 'player' });
    expect(parseHash(`#/gm/${ID}/sheets`)).toEqual({ campaignId: ID, view: 'sheets', role: 'gm' });
  });
  it('legacy view names still open', () => {
    expect(parseHash(`#/c/${ID}/table`).view).toBe('network');
    expect(parseHash(`#/c/${ID}/scene`).view).toBe('play');
    expect(parseView('play')).toBe('play');
    expect(parseView('tools')).toBe('tools');
    expect(parseView('nonsense')).toBe('network');
  });
  it('bad ids fall back to home', () => {
    expect(parseHash('#/c/short').campaignId).toBeNull();
    expect(parseHash('#/x/' + ID).campaignId).toBeNull();
    expect(parseHash('').campaignId).toBeNull();
  });
  it('hrefFor builds both link kinds and omits the default view', () => {
    expect(hrefFor(ID)).toBe(`#/c/${ID}`);
    expect(hrefFor(ID, 'play', 'gm')).toBe(`#/gm/${ID}/play`);
    expect(hrefFor(ID, 'network', 'gm')).toBe(`#/gm/${ID}`);
  });
});
