import { describe, expect, it } from 'vitest';
import { effectiveView, visibleViews } from './context';

describe('visible views', () => {
  it('desktop: players see five tabs, the GM six, keys by position', () => {
    expect(visibleViews('player').map((v) => v.id)).toEqual(['play', 'sheets', 'references', 'network', 'sparks']);
    expect(visibleViews('gm').map((v) => `${v.key}:${v.id}`)).toEqual(['1:play', '2:sheets', '3:references', '4:network', '5:sparks', '6:tools']);
  });
  it('compact: Sheets, References and Dice only, for either role', () => {
    expect(visibleViews('player', true).map((v) => `${v.key}:${v.id}`)).toEqual(['1:sheets', '2:references', '3:dice']);
    expect(visibleViews('gm', true).map((v) => v.id)).toEqual(['sheets', 'references', 'dice']);
  });
  it('compact falls back to Sheets for views it does not carry', () => {
    expect(effectiveView('play', true)).toBe('sheets');
    expect(effectiveView('network', true)).toBe('sheets');
    expect(effectiveView('dice', true)).toBe('dice');
    expect(effectiveView('play', false)).toBe('play');
  });
});
