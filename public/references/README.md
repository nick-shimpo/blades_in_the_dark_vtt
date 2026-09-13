# References: maps and handouts

Static image assets for the References tab live in this folder. Vite serves `public/` at the site root under the deployment base path, so a file here called `doskvol-map.png` is reachable in the app as `references/doskvol-map.png` (the view builds the URL with `import.meta.env.BASE_URL`).

## Adding an image

1. Drop the image into this folder. `.png`, `.jpg` and `.webp` all work. Keep the filename lower-case with hyphens, and keep the file a sensible size for a web page (a few MB at most).
2. Register it in `src/views/references/manifest.ts` by adding an entry to `MANIFEST`:

   ```ts
   { id: 'doskvol-map', label: 'Doskvol', kind: 'image', src: 'doskvol-map.png', credit: 'Official map, Blades in the Dark core rulebook' }
   ```

   `id` is the stable key (also what the remembered selection is stored under), `label` is the caption under the thumbnail in the rail, `src` is the filename in this folder, and `credit` is an optional line shown under the image.
3. Rebuild. The entry appears in the rail under MAPS & HANDOUTS with the image as its thumbnail; in the main panel a click toggles between fit-to-panel and natural size.

The manifest can be registered before the file exists: the entry still shows in the rail with a "not yet added" thumbnail, and the main panel says which file is missing. That is the current state of the Doskvol map.

## Currently registered

| id | file | status |
|---|---|---|
| `doskvol-map` | `doskvol-map.png` | registered, file not yet added |
