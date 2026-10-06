# Dekiru

Coins.ph deck builder. Decks are **data**; slides render from a **pattern library** in code; the output is an **HTML deck** (fixed 16:9, scaled to fit).

Spec: see `docs/dekiru-v1-spec.md` in the Dekiru project folder. This repo is milestone 1: the pattern library + the Sales master deck rebuilt from Figma.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

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
src/content/decks/     master decks as JSON (seed for Postgres later)
scripts/build-seed.py  Figma extraction → src/content/decks/sales.json
specs/                 Figma extraction: per-pattern specs, verbatim content, reference code
public/figma/          assets exported from Figma (+ ref/ screenshots for /compare)
```

## Adding a pattern

1. Triage first: new words/images on an existing layout = a **block** (no code). Small visual switch = a **variant** prop. New arrangement = new **pattern**. Missing element = new **component**.
2. Add `src/deck/patterns/YourPattern.tsx` exporting the component and `yourPatternMeta` (default chrome, budgets). Raw CSS lives only here, never in deck data.
3. Register it in `src/deck/registry.ts`. It appears in `/library` automatically.
4. Review on the Vercel preview, approve, merge.

## Not built yet (later milestones)

Postgres storage, Google sign-in + roles, publish/share links with passwords, view analytics, the Claude connector (remote MCP) for generation, the block picker, Ramp master deck.
