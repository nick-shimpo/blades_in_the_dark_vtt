/**
 * The reference sheets shown in the References rail, in rail order.
 *
 * Since 2026-09-14 these are pages lifted straight from the official Blades in the Dark
 * Player Kit (v8.2, bladesinthedark.com/downloads), rendered as images into public/references/.
 * The earlier sheets built from the rules text were replaced at the owner's request.
 *
 * Two kinds remain supported:
 *  - 'image'  a static asset in public/references/ (see the README there), shown as a thumbnail;
 *  - 'sheet'  a component, shown as a live miniature (none registered at the moment).
 * `group` decides the rail heading: 'rules' (RULES) or 'handouts' (MAPS & HANDOUTS).
 */
import type { FunctionComponent } from 'preact';

export type RefGroup = 'rules' | 'handouts';

export interface SheetEntry {
  id: string;
  label: string;
  kind: 'sheet';
  component: FunctionComponent;
  group?: RefGroup;
}

export interface ImageEntry {
  id: string;
  label: string;
  kind: 'image';
  /** File name under public/references/. */
  src: string;
  credit?: string;
  group?: RefGroup;
}

export type RefEntry = SheetEntry | ImageEntry;

export function groupOf(e: RefEntry): RefGroup {
  return e.group ?? (e.kind === 'sheet' ? 'rules' : 'handouts');
}

const KIT = 'Blades in the Dark Player Kit v8.2';

export const MANIFEST: RefEntry[] = [
  { id: 'kit-rules-overview', label: 'Simple Rules Overview', kind: 'image', src: 'playerkit-p01.png', credit: `${KIT}, p. 1`, group: 'rules' },
  { id: 'kit-rules-reference-1', label: 'Rules Reference 1', kind: 'image', src: 'playerkit-p26.png', credit: `${KIT}, p. 26`, group: 'rules' },
  { id: 'kit-rules-reference-2', label: 'Rules Reference 2', kind: 'image', src: 'playerkit-p27.png', credit: `${KIT}, p. 27`, group: 'rules' },
  { id: 'kit-gm-reference', label: 'GM Reference', kind: 'image', src: 'playerkit-p28.png', credit: `${KIT}, p. 28`, group: 'rules' },
  { id: 'kit-items-vice', label: 'Standard Items & Vice Purveyors', kind: 'image', src: 'playerkit-p11.png', credit: `${KIT}, p. 11`, group: 'rules' },
  { id: 'kit-doskvol-map', label: 'Doskvol', kind: 'image', src: 'playerkit-p22.png', credit: `${KIT}, p. 22`, group: 'handouts' },
];
