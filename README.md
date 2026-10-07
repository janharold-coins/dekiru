# Dekiru

Coins.ph deck builder. Decks are **data**; slides render from a **pattern library** in code; the output is an **HTML deck** (fixed 16:9, scaled to fit).

Spec: see `docs/dekiru-v1-spec.md` in the Dekiru project folder. Milestone 1: the pattern library + the Sales and Ramp master decks rebuilt from Figma. Milestone 2 (in progress): database, sign-in, sharing.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Without a database the app reads the master decks straight from `src/content/decks/*.json`.

## Database (Neon)

Decks, versions (draft / published), share links and view analytics live in Postgres on Neon. Schema: `src/db/schema.ts`; all reads and writes go through `src/lib/decks.ts`.

One-time setup:

1. Vercel → the dekiru project → **Storage** → **Create** → **Neon** → connect it to the project. This sets `DATABASE_URL` for every environment.
2. Locally: `npx vercel link` then `npx vercel env pull .env.local`.
3. `npm run db:migrate` — creates the tables.
4. `npm run db:seed` — loads the Sales and Ramp masters as v1 (published).

Day to day:

| Command | What |
|---|---|
| `npm run db:seed` | Create any master deck that's missing |
| `npm run db:seed -- --update` | Publish a new version of a master whose JSON changed (after `python3 scripts/build-seed.py`) |
| `npm run db:generate` | After editing `src/db/schema.ts`: write the next migration into `drizzle/` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Browse the data |

How versions work: each deck has at most one **draft** (where edits land) and any number of **published** versions; people see the newest published one. Share links point at one published version, so publishing again never changes what a sent link shows. Slides shared between masters are stored as references (`{"id":"s01","ref":"sales/s01"}`) and follow the referenced deck's newest published version. A personal copy is a snapshot: master edits don't reach it.

| Route | What |
|---|---|
| `/` | Decks |
| `/decks/sales` | Slide grid with preview-only overflow and image-fit warnings |
| `/decks/sales/present` | Presenter: ← → / space, Home/End, **F** for full screen, `#n` deep-links a slide |
| `/decks/sales/compare` | Figma frame vs code render, side by side |
| `/library` | All patterns, their budgets, and every slide that uses them |

## Fonts

The design uses **Cns Manrope** and **TWK Everett**. If they're installed on the viewer's machine they're used; otherwise the app falls back to Manrope (Google) and Inter. Add licensed `.woff2` files + `@font-face` to make every viewer see the exact faces.

## Structure

```
src/deck/
  tokens.ts            colours, backgrounds, font stacks, t() typography helper
  types.ts             Deck, SlideData, Chrome, PatternMeta, budgets
  chrome/Chrome.tsx    background + glow, logo, confidentiality footer, accent bar, co-brand slot
  frame/               SlideFrame (1920×1080), ScaledSlide (fit to container), PreviewChecks
  components/          TitleCage, LogoItem, ProductParts (section header, bullets, price/tier chips)
  patterns/            15 patterns — each exports Component + meta (default chrome, budgets)
  registry.ts          pattern id → component
  overflow.ts          budget checks (flag only, never shrink)
  RenderSlide.tsx      slide data → rendered slide
src/content/decks/     master decks as JSON (Figma build; the database seed)
src/content/resolve.ts slide references ("sales/s01") → slides; snapshots for copies
src/db/                Drizzle schema + client (Postgres / Neon)
src/lib/decks.ts       read/write decks: database when DATABASE_URL is set, else the JSON seed
drizzle/               SQL migrations
scripts/build-seed.py  Figma extraction → src/content/decks/{sales,ramp}.json
scripts/db-seed.ts     JSON masters → database
specs/                 Figma extraction: per-pattern specs, verbatim content, reference code
public/figma/          assets exported from Figma (+ ref/ screenshots for /compare)
```

## Adding a pattern

1. Triage first: new words/images on an existing layout = a **block** (no code). Small visual switch = a **variant** prop. New arrangement = new **pattern**. Missing element = new **component**.
2. Add `src/deck/patterns/YourPattern.tsx` exporting the component and `yourPatternMeta` (default chrome, budgets). Raw CSS lives only here, never in deck data.
3. Register it in `src/deck/registry.ts`. It appears in `/library` automatically.
4. Review on the Vercel preview, approve, merge.

## Not built yet (later milestones)

Google sign-in + roles, publish/share links with passwords, view analytics (tables exist), the Claude connector (remote MCP) for generation, the block picker.
