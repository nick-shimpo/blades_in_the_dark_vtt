/**
 * The reference sheets shown in the References rail, in rail order. Two kinds:
 *  - 'sheet'  a component built from the rules (src/views/references/sheets/*), shown as a live miniature;
 *  - 'image'  a static asset dropped into public/references/ (see the README there), shown as a thumbnail.
 * Image entries whose file is missing still appear, marked "not yet added".
 */
import type { FunctionComponent } from 'preact';
import { ActionRollSheet } from './sheets/ActionRoll';
import { ActionsSheet } from './sheets/Actions';
import { AdvancementSheet } from './sheets/Advancement';
import { ConsequencesSheet } from './sheets/Consequences';
import { DowntimeSheet } from './sheets/Downtime';
import { PlanningSheet } from './sheets/Planning';
import { PositionEffectSheet } from './sheets/PositionEffect';
import { TeamworkSheet } from './sheets/Teamwork';

export interface SheetEntry {
  id: string;
  label: string;
  kind: 'sheet';
  component: FunctionComponent;
}

export interface ImageEntry {
  id: string;
  label: string;
  kind: 'image';
  /** File name under public/references/. */
  src: string;
  credit?: string;
}

export type RefEntry = SheetEntry | ImageEntry;

export const MANIFEST: RefEntry[] = [
  { id: 'action-roll', label: 'Action Roll', kind: 'sheet', component: ActionRollSheet },
  { id: 'position-effect', label: 'Position & Effect', kind: 'sheet', component: PositionEffectSheet },
  { id: 'consequences', label: 'Consequences & Resistance', kind: 'sheet', component: ConsequencesSheet },
  { id: 'teamwork', label: 'Teamwork', kind: 'sheet', component: TeamworkSheet },
  { id: 'planning', label: 'Planning & Engagement', kind: 'sheet', component: PlanningSheet },
  { id: 'downtime', label: 'Downtime', kind: 'sheet', component: DowntimeSheet },
  { id: 'advancement', label: 'Advancement & the Faction Game', kind: 'sheet', component: AdvancementSheet },
  { id: 'actions', label: 'The Twelve Actions & Gathering Information', kind: 'sheet', component: ActionsSheet },
  { id: 'doskvol-map', label: 'Doskvol', kind: 'image', src: 'doskvol-map.png', credit: 'Official map, Blades in the Dark core rulebook' },
];
