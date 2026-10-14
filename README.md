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

Admins change roles on the **People** page (`/people`). There's always at least one admin. From a terminal: `npm run user:role -- name@coins.ph manager`.

Code: `src/lib/auth.ts` (server: config, `requireUser()` at the top of every private page), `src/proxy.ts` (fast redirect when there's no session cookie), `src/app/sign-in/`.

## Share links

Deck page → **Share** (`/decks/<id>/share`). A link is a public URL (`/s/<slug>`, no sign-in) for the deck as it is right now:

- **Frozen.** The link stores a snapshot of the newest published version (shared slides resolved), so later edits — even to a shared Sales slide — never change a sent link. Make a new link to send an update.
- **Password by default.** Generated (`abcd-efgh`, shown once to the creator) or set by hand; "no password" is allowed with a warning. Stored as a scrypt hash. Unlocking sets a cookie for that link only (7 days); revoking the link locks it again.
- **Expiry** 7 / 30 (default) / 90 days or never. **Revoke** any time: the creator, admins and managers can.
- The list shows who made each link, for whom, which version, how many times it was opened and when last.
- **Report per link** (click the name or the opens count): opens, total and average time viewed, last opened, time per slide with how many visits reached it, and each visit. Only time the deck is on screen counts. Every visit counts, split into **Recipients** (not signed in to Dekiru — the client on their own; no identity or IP stored) and **Team** (signed in — a rep presenting it in a meeting or checking it, recorded with who). The report filters All / Recipients / Team.

**Presentations.** When a rep presents with the deck's **Present** button (like presenting from Google Slides), the session is tracked too: who presented, when, how long, time per slide, and an optional **Presenting to…** note typed into the bar at the bottom of the presenter. Deck page → **Presentations**. Sessions under 30 s count as quick checks and are hidden by default.

Code: `src/lib/share.ts`, `src/lib/analytics.ts`, `src/app/decks/[id]/present/` (presenter + tracking), `src/app/decks/[id]/presentations/`, `src/app/decks/[id]/share/`, `src/app/s/[slug]/` (tracking beacon: `s/[slug]/track`).

## Making and arranging decks in the app

- **New deck** (Home → + New deck, `/new`): name it, tick approved slides from the company masters (grouped by section, in the order you tick them), Create.
- **Make a copy** of any deck you can see.
- **Arrange slides** (`/decks/<id>/edit`, editors only): drag or ↑ ↓ to reorder, Hide/Show, Remove (asks once), **+ Add approved slides** (`/decks/<id>/add`).
- Approved slides are stored as references and keep following their master; the editor says so on each.
- Every change saves to the draft; the yellow bar offers **Publish** or **Discard**.
- **History** (`/decks/<id>/history`): every version with who and when; View any version; **Restore** puts an old version back as a draft.
- Text changes go through Claude (Dekiru connector) for now.

## Claude connector (make and edit decks from Claude)

Dekiru is a remote MCP server at **`https://<domain>/api/mcp`**. People add it to Claude as a custom connector and sign in
with their coins.ph Google account (OAuth via Better Auth's MCP plugin, with an "Allow Claude?" consent page at `/connect`).
Every tool call then acts as that person.

Tools: `list_decks`, `get_deck`, `list_patterns`, `get_pattern` (real example props from the masters), `copy_deck`,
`create_deck`, `add_slide` (an approved block like `sales/s04`, or a new slide), `update_slide`, `remove_slide`, `move_slide`,
`hide_slide`, `publish_deck`. Server instructions tell Claude how to work: reuse blocks, one slide at a time, respect budgets,
never invent figures, publish only when asked.

Rules enforced on the server:
- Masters: admins and managers edit; everyone can copy. Copies: only the owner. Others' copies are invisible.
- Every edit lands in a draft; the deck page shows editors the draft with a **Publish** button.
- Every new or changed slide is rendered on the server before saving; props that break the layout are rejected with the
  reason, and overflow warnings come back so Claude can suggest shorter text.
- Blocks are stored as references and keep following the master; editing one turns it into the deck's own slide (Claude is told).
- Only Claude's callback URLs (`claude.ai`, `claude.com`) and `localhost` can register as clients (`MCP_ALLOWED_REDIRECTS` adds more).

Setup (owner of the Coins Claude workspace): Settings → Connectors → Add custom connector → name **Dekiru**, URL `https://coins-dekiru.vercel.app/api/mcp`.
For a quick personal test without org setup: Claude Code `claude mcp add --transport http dekiru https://coins-dekiru.vercel.app/api/mcp`.

Code: `src/app/api/mcp/route.ts`, `src/lib/mcp-tools.ts`, `src/lib/editing.ts`, `src/lib/access.ts`, `src/app/connect/`, `src/app/.well-known/`.

## Database (Neon)

Decks, versions (draft / published), share links and view analytics live in Postgres on Neon. Schema: `src/db/schema.ts`; all reads and writes go through `src/lib/decks.ts`.

One-time setup:

1. Vercel → the dekiru project → **Storage** → **Create** → **Neon** → connect it to the project. This sets `DATABASE_URL` for Production and Preview.
2. Locally: Vercel → Storage → the Neon database → Quickstart → **.env.local** tab → **Copy Snippet**, paste into `.env.local`. (The integration doesn't offer Development, so `vercel env pull` won't bring it — and running `vercel env pull` later overwrites `.env.local`.)

**Nothing to run after that.** `npm run dev` and every Vercel build first apply any new migrations and sync the master decks from the Figma build (`scripts/prepare-db.ts`, ~0.1 s when there's nothing to do). On Vercel a failed migration stops the deploy, so the live site keeps its previous version; locally it only warns.

Master sync rule: a master whose JSON changed gets a new published version — unless its newest version was edited in the app, which is never overwritten automatically (`npm run db:seed -- --force` does it on purpose).

| Command | What |
|---|---|
| `npm run db:generate` | After editing `src/db/schema.ts`: write the next migration into `drizzle/` (commit it; it applies itself) |
| `npm run db:migrate` | Same as the automatic step, on demand |
| `npm run db:seed -- --force` | Overwrite masters with the Figma build even if edited in the app |
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

Approval requests for masters, image uploads, block picker in the app, the Claude connector (remote MCP) for generation, the block picker.
