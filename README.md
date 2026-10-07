# Dekiru

Coins.ph deck builder. Decks are **data**; slides render from a **pattern library** in code; the output is an **HTML deck** (fixed 16:9, scaled to fit).

Spec: see `docs/dekiru-v1-spec.md` in the Dekiru project folder. Milestone 1: the pattern library + the Sales and Ramp master decks rebuilt from Figma. Milestone 2 (in progress): database, sign-in, sharing.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Without a database the app reads the master decks straight from `src/content/decks/*.json`.

## Sign-in (Google)

Every page needs a @coins.ph Google sign-in. The **first person to sign in becomes admin**; everyone after is a member.

| Variable | Where it comes from |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud Console → project "Dekiru" → Google Auth Platform → Clients → "Dekiru web" (audience: Internal) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` — same value on Vercel and locally |

Google client redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<production domain>/api/auth/callback/google`. Preview deployments can't sign in (Google needs exact URLs).

Without these settings, sign-in is off: local development runs open; deployments on Vercel refuse every page.

| Command | What |
|---|---|
| `npm run user:role` | List everyone who has signed in, with roles |
| `npm run user:role -- name@coins.ph manager` | Change a role (`admin`, `manager`, `member`) |

Code: `src/lib/auth.ts` (server: config, `requireUser()` at the top of every private page), `src/proxy.ts` (fast redirect when there's no session cookie), `src/app/sign-in/`.

## Share links

Deck page → **Share** (`/decks/<id>/share`). A link is a public URL (`/s/<slug>`, no sign-in) for the deck as it is right now:

- **Frozen.** The link stores a snapshot of the newest published version (shared slides resolved), so later edits — even to a shared Sales slide — never change a sent link. Make a new link to send an update.
- **Password by default.** Generated (`abcd-efgh`, shown once to the creator) or set by hand; "no password" is allowed with a warning. Stored as a scrypt hash. Unlocking sets a cookie for that link only (7 days); revoking the link locks it again.
- **Expiry** 7 / 30 (default) / 90 days or never. **Revoke** any time: the creator, admins and managers can.
- The list shows who made each link, for whom, which version, and how many times it was opened (view tracking is the next step).

Code: `src/lib/share.ts`, `src/app/decks/[id]/share/`, `src/app/s/[slug]/`.

## Database (Neon)

Decks, versions (draft / published), share links and view analytics live in Postgres on Neon. Schema: `src/db/schema.ts`; all reads and writes go through `src/lib/decks.ts`.

One-time setup:

1. Vercel → the dekiru project → **Storage** → **Create** → **Neon** → connect it to the project. This sets `DATABASE_URL` for Production and Preview.
2. Locally: Vercel → Storage → the Neon database → Quickstart → **.env.local** tab → **Copy Snippet**, paste into `.env.local`. (The integration doesn't offer Development, so `vercel env pull` won't bring it — and running `vercel env pull` later overwrites `.env.local`.)
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

Role-based editing and approvals, view analytics (opens, time per slide), image uploads, the Claude connector (remote MCP) for generation, the block picker.
