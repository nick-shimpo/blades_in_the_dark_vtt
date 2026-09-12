# Ledger schema (the campaign document)

Everything a table changes lives in **one JSON document**, the *ledger*. The prototype keeps it in `localStorage` and mirrors it to a linked `.ledger.json` file; the production app should keep the same shape as its server-side document so existing ledgers import unchanged. `data/ledger.example.json` is a small valid example.

Reference data (the rulebook roster, sheet content, spark tables) is **not** in the ledger — it ships with the app (`data/*.json`) and the ledger only points at it by id (`ref`, `playbook`, `type`, ability/item/upgrade ids).

```ts
type Ledger = {
  app: 'bitd-gm-cockpit';     // marker used to recognise a pasted / imported file
  v: 1;
  savedAt: string;            // ISO timestamp, set on every save; newest wins on reconnect
  seq: number;                // monotonically increasing counter used to mint node/edge ids (n12, e13)
  crew: { name: string; meta?: string };   // crew name is shared by the Table crew card and the crew sheet
  nodes: Node[];
  edges: Edge[];
  sheets: { crew: CrewSheet; chars: CharacterSheet[] };
};
```

## Table (network map)

```ts
type NodeType = 'crew' | 'faction' | 'npc' | 'location' | 'district' | 'org' | 'other';

type Node = {
  id: string;                 // 'n' + seq
  type: NodeType;
  name: string;
  x: number; y: number;       // world coordinates of the card centre (canvas is nominally 4000 x 3000)
  ref?: string;               // id into data/book.json (factions / npcs / locations / districts) when added from the book
  page?: number;              // book page, for the dossier header
  tier: string;               // roman numeral '', '0', 'I' … 'VI' (factions, crew, org, other). Crew card displays sheets.crew.tier when a crew type is chosen
  district: string;           // free text, district names offered as suggestions
  status: number;             // -3 … +3 crew status. Drives the card tint, border colour and STATUS band. Crew card ignores it
  blurb: string;              // the one line on the card; '' = derive from book fields (see rules-engine.md §1)
  wants: string; details: string; moves: string; notes: string;   // dossier prose, markdown
  f: Record<string, string>;  // templated book fields per type (faction: hold, category, tagline, turf, npcs, assets, quirks, allies, enemies, situation …). Seeded from the book, editable
  clocks: Clock[];
  bookClocksSeeded?: boolean; // set once the faction's book clocks have been created as real clocks
};

type Clock = { id: string; name: string; size: 4|6|8|10|12; filled: number };

type Edge = {
  id: string;                 // 'e' + seq
  from: string; to: string;   // node ids. Always one-directional. Two edges may exist between the same pair (one each way)
  label: string;              // free text, edited by clicking the label on the canvas
  note?: string;
  fromSide?: 'n'|'s'|'e'|'w'; // port the edge leaves / enters; if absent, the nearest side is used
  toSide?: 'n'|'s'|'e'|'w';
};
```

Legacy edges with `dir` (1 = forward, 2 = reverse, 3 = both) are migrated on load into one or two one-way edges; keep that migration.

## Sheets

```ts
type CrewSheet = {
  type: 'assassins'|'bravos'|'cult'|'hawkers'|'shadows'|'smugglers'|null;   // null → crew type picker
  reputation: string;         // one of sheets.json reputations, or ''
  lair: string; lairDistrict: string;
  groundsDistrict: string; operation: string;   // hunting grounds / sacred sites / sales territory / cargo types; operation is one of crew.operations[].name
  deity: string;              // Cult only
  rep: number;                // 0 … 12 − turf
  tier: number;               // 0 … 6 (sheet shows 0 … IV)
  hold: 'weak'|'strong';
  heat: number;               // 0 … 8 (9 rolls into wanted)
  wanted: number;             // 0 … 4
  coin: number;               // 0 … 4 / 8 / 16 (vault upgrade)
  xp: number;                 // 0 … 7 (8 rolls into an advance)
  advances: number;           // unspent crew advances
  abilities: Record<abilityId, boolean>;
  upgrades: Record<upgradeId, number>;   // boxes filled; ids from crew.upgrades and sheets.json generalUpgrades
  cohorts: Cohort[];
  claims: Record<'row,col', boolean>;    // 3 x 5 grid, row/col 0-based, lair at '1,2' never stored
  contacts: Record<contactName, ''|'friend'|'rival'>;
};

type Cohort = {
  id: string; kind: 'gang'|'expert'; name: string;
  types: string[];            // gang types (max 2) from sheets.json cohort.gangTypes
  expertType: string;         // free text for experts
  edges: string[]; flaws: string[];      // max 2 each
  harm: 0|1|2|3|4;            // weakened / impaired / broken / dead
  armor: boolean;
};

type CharacterSheet = {
  id: string;                 // 'ch' + timestamp
  playbook: 'cutter'|'hound'|'leech'|'lurk'|'slide'|'spider'|'whisper';
  name: string; alias: string; look: string;
  heritage: string; heritageDetail: string;
  background: string; backgroundDetail: string;
  vice: string; viceDetail: string;
  stress: number;             // 0 … max−1 (reaching max triggers trauma)
  trauma: number;             // 0 … 4 (5 with Hardened / Ordained)
  traumaConds: string[];      // chosen condition names
  harm: { 3: [string]; 2: [string, string]; 1: [string, string] };   // injury text per cell
  healing: number;            // 0 … 3 healing clock ticks (fills at 4)
  armor: { armor?: boolean; heavy?: boolean; special?: boolean };
  abilities: Record<abilityId, boolean>;          // own playbook abilities
  veteran: { pb: playbookId; id: abilityId }[];   // abilities taken from other playbooks
  xp: { playbook?: number; insight?: number; prowess?: number; resolve?: number };
  advances: { playbook?: number; insight?: number; prowess?: number; resolve?: number };  // unspent
  actions: Record<actionId, 0|1|2|3|4>;           // hunt, study, survey, tinker, finesse, prowl, skirmish, wreck, attune, command, consort, sway
  load: 'light'|'normal'|'heavy';
  items: Record<itemId, boolean>;                  // ids from playbook items + sheets.json standardItems
  coin: number;               // 0 … 4
  stash: number;              // 0 … 40
  friends: Record<npcName, ''|'friend'|'rival'>;
};
```

Ids for abilities, items and upgrades are `snake_case` of the name (`not_to_be_trifled_with`, `a_blade_or_two`, `training_prowess`), exactly as they appear in `data/sheets.json`.
