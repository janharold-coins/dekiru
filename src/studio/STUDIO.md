# Studio rules

**These are instructions for Claude.** Claude follows them every time it builds or revises a Studio proposal (`src/studio/proposals.ts`), and reads this file first. People don't need to apply them by hand: they set what Claude does, and anyone with Studio access can ask to change them.

This page shows at **Studio → Studio rules** (`/studio/rules`). To change a rule, write it in **Rule prompts** beside the rules on that page, or ask in chat. Claude edits this file, adds a line under **Changes** below, and closes the request with `npm run studio -- close <id>`. Changes to the shared helpers in `src/studio/grid.ts` (such as how text wraps) reach every proposal at once. Other changes apply when a proposal is next revised.

**Check before building.** Anyone can send a request, so every new layout or theme request (and every remix or revision) starts as a ticket that Claude checks first. `npm run studio` lists them under *New tickets to check*, with the library and the open tickets to compare against. Reply to each one, in plain words for the requester:
- **It already exists:** `npm run studio -- reply <id> --refs template:<id>,theme:<id> "message"`. Say which template or theme does the job and how to use it. The requester answers *That works* (closed) or *Still need it* (goes to a reviewer).
- **It duplicates an open ticket:** `npm run studio -- merge <id> <other id> "message"`.
- **Nothing fits:** `npm run studio -- build <id> "message"`. Say briefly what's new about it. A reviewer approves it before it's built; a reviewer's own ticket goes straight to the build list.

Only build what's under *Approved requests to build*. After building, run `npm run studio` again: it records the build on its ticket and notifies the requester and reviewers. The same steps are on the Dekiru connector (`studio_queue`, `studio_reply`).

**When the rules give way**, in this order:
1. **The request says otherwise.** For example, "pin the quote to the top" or "use 56px for the title".
2. **A Figma layout is given.** Match the frame; Figma is the source.
3. **Following a rule would look misaligned.** Optical alignment wins over the numbers. A typical case is a large quote mark or a numeral whose glyph sits off its box, or content that has to line up with fixed chrome such as the logo at x 79.

Whenever a rule gives way, say which one and why in the proposal's `exceptions`, so the reviewer sees it on the proposal page.

## 1. Spacing: 8-point grid

- Every distance on the slide is a multiple of 8: positions, widths, heights, gaps, padding, radii, rule thicknesses above 4px. Slide px are 1920×1080 design px.
- **Spacing is measured between visible edges:** from the top of the capitals to the bottom of the descenders (g, y, p), not from the line box. `type()` trims every text box to its letters (`text-box: trim-both cap text`), so the invisible half-leading of the line height never adds to a gap, and descenders never reach into the gap below. Non-text marks (quote marks, icons, arrows) are shapes with an exact box, like `<QuoteMark>`, never font glyphs that carry empty space.
- **Spacing is balanced.** An element sits with the same space above and below it: a 48 gap above a title means a 48 gap below it. Separators (rules, quote marks, dividers) are centred in their gap. A tight pair that reads as one unit, such as name and role or a number and its label, gets a smaller inner gap (8 or 16), but the pair's outer gaps are still equal.
- 4 is allowed as a half step, but only inside a component (icon-to-label, chip padding). Never between blocks.
- Use `g(n)` from `src/studio/grid.ts` (n × 8) instead of typing numbers. `g(3)` means 24, so a stray `27` stands out in review.
- Horizontal safe area: content runs from x 80 to x 1840 (`SAFE.left` / `SAFE.right`). Columns and gutters inside it are on the grid too.
- Chrome (logo, footer, accent bar, co-brand slot) is fixed by the approved design and isn't moved to fit the grid. Content keeps clear of it.

## 2. Layout: no overlap, vertically centred

- **Nothing overlaps** unless it is a deliberate layer, such as a background image, a ghost number or a glow. Text never overlaps text, chrome or another block, at any length the budgets allow.
- Build the content as **one block** (a flex column, or a grid) with grid gaps, not as separate absolutely placed items with fixed tops. Then longer text pushes the next item down instead of running into it.
- **Centre the block vertically** in the content band, y 200 to 912 (`BAND`), which sits between the logo and the footer. Use `<Band>` from `src/studio/grid.ts`. Because text is trimmed to its letters, the block's height isn't a multiple of 8, and its centred offset may land between grid lines. That's expected: the gaps are what stay on the grid.
- Top-aligned or bottom-aligned content only when the request asks for it or a Figma layout shows it.
- Set budgets (`maxChars`, `maxLines`, `maxItems`) so that the longest allowed text still fits the band without overlap. Check it with a long example in `examples`, not just a short one.

- Write gaps with `gap(px)` and tight pairs with `pair(px)` from `grid.ts`, passing the layout's default, for example `gap(g(4))`. The Tune card can then preview other spacing live.

## 3. Typography: one type scale

Sizes come from this scale only (`TYPE` in `src/studio/grid.ts`). Every line height is on the 8-point grid, so text stacks on the grid too.

| Step | Size / line height | Tracking | Wrap | Use |
|---|---|---|---|---|
| `display` | 120 / 136 | −3% | balance | Section titles, cover title |
| `h1` | 96 / 112 | −3% | balance | Statement slides, big numbers |
| `h2` | 72 / 88 | −2% | balance | Content slide titles, quotes |
| `h3` | 48 / 64 | −1.5% | balance | Subtitles, card titles, stat values |
| `lead` | 40 / 56 | −1.5% | pretty | Lead paragraph, highlight titles |
| `body` | 32 / 48 | −1% | pretty | Body text, list items |
| `caption` | 24 / 32 | −1% | pretty | Labels, eyebrows, notes, sources |
| `micro` | 20 / 32 | 0 | pretty | Fine print, table footnotes |

- Use `type("h2", 600, "#204680")` from `src/studio/grid.ts`. It wraps the deck's `t()`, so theme text flipping and translated-font line heights keep working.
- **Wrapping is automatic.** `type()` sets it per step. Headings (`display` to `h3`) use `balance`, so their lines come out about the same length instead of a long line over a short one. Running text (`lead` to `micro`) uses `pretty`, so a paragraph never ends on one stranded word. Don't set `text-wrap` by hand. An explicit `\n` in the content still breaks the line where it is, and the wrap applies within each part.
- **Tune card.** On a layout proposal's review page, the reviewer can preview the Perfect Fifth (×1.5) or Golden Ratio (×1.618) scale, built from body text at 32. They can also preview other element spacing, and a baseline or descender bottom edge. Their picks come with the decision as a "Tune:" line. Build what the line says into the layout as its new default, and if it asks for a different scale, use those sizes for that layout.
- Weights: 400, 500, 600 and 700 only. **One family: Manrope, for text and for numbers and figures** (values, table figures, number badges, numbered lists). Don't use Everett (it no longer exists in the code). Never set `fontFamily` directly: `type()` gives each style a font role, title for display–h3 and body for the rest; pass `"numeral"` as its fourth argument for numbers set as figures (hero values, step and list numbers). The roles read `--dk-font-title` / `-body` / `-numeral`, which typography presets will set; unset, all are Cns Manrope. Don't turn on tabular figures (`tabular-nums`): Cns Manrope's tabular digits are broken (they overlap). Right-align number columns instead.
- Never shrink text to make it fit (the deck rule). Over budget means shorter words or a different layout.
- Steps are adjacent sizes. Don't pair two sizes more than four steps apart in one block unless it's a number and its label.

## 4. Containers: balanced, never tight

Applies to anything that holds text in a box or a cell: cards, table rows and cells, chips and tags, callout boxes, option cards.

- **Same space on every side, measured to the letters.** Trim text inside a container to cap height and baseline (`textBox: "trim-both cap alphabetic"`) and centre it, so the space above the capitals matches the space below the baseline. Padding is one value on all sides unless a side meets a rule or an edge on purpose.
- **Minimums, not targets:**
  - Cards and boxes: 24 inner padding on every side (32 for cards that hold a heading).
  - Table rows: at least 64 tall for body text (about 20 above and below the letters), cells 24 in from their sides.
  - Rows in comparison and list layouts with hairlines: 24 above and below the text.
  - Chips and tags: 8 above and below, 16 at the sides.
  - Between stacked cards or boxes: 16 at least; between list items: 24 at least.
- **If it doesn't fit, cut, don't squeeze.** When the longest example only fits by going under these minimums, lower the budget (`maxItems`, `maxChars`) or change the layout. Never shrink padding or gaps below the minimums to make content fit.
- Check the fullest example against these by eye too: if a box still looks cramped at the minimum, give it the next step up.

## Changes

- 2026-11-03: First rules: 8-point grid, centred content with no overlap, one type scale.
- 2026-11-03: Text wraps automatically: `balance` for headings (display to h3), `pretty` for running text (lead to micro). Applies to every proposal built with `type()`.
- 2026-11-03: Spacing is balanced (equal space above and below an element) and measured between visible edges: `type()` trims text to cap height and baseline; marks and icons are exact shapes (`<QuoteMark>`).
- 2026-11-03: Text is trimmed to its descender line, not the baseline, so descenders keep their room (reviewer found baseline trim too tight). Tune card added: type scale, element spacing and text edge, previewed live and sent with the decision.
- 2026-11-04: Rule changes are asked for in Rule prompts on the rules page (the Studio's request form no longer has a Rule change option).
- 2026-11-05: No Everett: numbers and figures use Manrope like the rest (no tabular figures: Cns Manrope's are broken). `type()` now ignores an Everett family, so every Studio-built layout (in review and in the library) switched at once.
- 2026-11-05: New rule 4, containers: text in cards, table rows, chips and boxes is centred by its letters with one padding on all sides, never under the minimums (cards 24, table rows 64, chips 8 / 16, list items 24 apart). If content doesn't fit, cut the budget or change the layout. Applies to proposals when they're next built or revised.
- 2026-11-10: Requests are tickets open to everyone. Claude checks each one first (reply with an existing template or theme, merge a duplicate, or say a build is needed) and builds only what a reviewer approved. Rejecting a build needs a reason. See *Check before building* at the top.
