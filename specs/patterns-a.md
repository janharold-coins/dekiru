# Patterns A: cover, agenda, section (L1/L2), statement-highlights, product-index, cta-contact, closing

All coordinates are absolute px in a 1920×1080 frame. Chrome (background, logo, footer, accent bar) and tokens are in `shared.md`. Verbatim text is in `content/sNN.json`. Figma reference code is in `raw/sNN.tsx`.

Notation:
- `Manrope` means Figma family **Cns Manrope**. `Everett` means **TWK Everett**.
- "lh" is line-height as a unitless multiplier of font-size.
- "trk" is letter-spacing in px.
- Text `top` is the top of the first line box (line box = font-size × lh). It is not the cap or baseline.
- **Fixed** means identical on every instance. **Content** means it comes from JSON.

---

## 1. `cover` (slide 1, node 511:28904)

Background `dark` + BG overlay. Logo **large white** (`logo-white.svg`, left 80.125, top 82, 299.41×71). Footer white at **left 81, top 981** (cover-only position). No accent bar.

| Element | Node | Geometry | Typography | Notes |
|---|---|---|---|---|
| Title (content) | 511:28908 | left 128, top 401; 2 lines → box ≈ 276 tall (401–677); nowrap | Manrope 500, 120, lh 1.15, trk −3.6, white | Two explicit paragraphs. Line 1 is `Global money. ` with a trailing space and `white-space: pre`. Line 2 is `Faster. Always on.` |
| Subtitle (content) | 511:28909 | left 128, top 708; 1 line (55.2 tall) | Manrope 400, 48, lh 1.15, trk −1.44, white | `white-space: pre`. Separators are **3 spaces + U+00B7 "·" + 3 spaces**. Keep them verbatim. |

Gap from title box bottom (677) to subtitle top (708) is 31.

---

## 2. `agenda` (slide 2, node 511:28911)

Background `light` (no overlay). Logo **dark** (left 79, top 125). Footer black (79, 938). **Accent bar** at bottom (0, 1069, 1920×11).

| Element | Geometry | Typography |
|---|---|---|
| Title (content) `What` / `we’ll cover.` (curly ’ U+2019) | left 79, top 381; 2 lines, nowrap | Manrope 500, 120, lh 1.15, trk −3.6, #000 |
| Agenda list (content, repeats) | 3 items. Item boxes: left 825, width 1010, height 308, **tops 78 / 386 / 694 (pitch 308, no gap)** | see item below |

**Agenda item** (component "Component 1", master 394:11838):
- Outer 1010×308 frame. Inner flex column with **padding 24**. Inner content box is 650×260 at (item.left+24, item.top+24).
- **Number** (Everett **Ultralight 200**, 120px, lh 1.15, trk −3.6, #000, **opacity 0.4**):
  - Box 200×138 at the inner origin, which is abs (849, item.top+24).
  - Values `01`, `02`, `03`.
  - Opacity is applied once at 0.4. It is not compounded.
- **Text column**: flex column, `gap: 18px`, at inner (220.7, 47) → abs **x 1069.7, y item.top+71** (149 / 457 / 765). Column width 489.303, but children overflow it.
  - Item title: Manrope 500, 72, lh 1.15 (82.8), trk −2.16, #000, nowrap.
  - Item description: Manrope 500, 40, lh 1.4 (56), trk −0.4, #000, **width 622**, wraps to 2 lines on all 3 items.
- Content per item: `number`, `title`, `description`. Items are equally spaced at a fixed 308 pitch and do not auto-flow.

---

## 3. `section`: level 1 and level 2

Both levels use background `dark` + BG overlay, logo white standard (79, 125), footer white (79, 938), and no accent bar.

### 3a. Section **level 1** (slides 3, 8, 37: nodes 511:28920, 511:29441, 511:31603)

| Element | Geometry | Typography |
|---|---|---|
| **Ghost number** (content: `01`/`02`/`03`) | **left 103**, top = title top (432 for 1-line titles, 357 for s37); nowrap | **Everett Regular 400, 120, lh 1.15, trk −3.6, white, opacity 0.2** |
| Title (content) | **left 279**, top 432 (s3, s8) / 357 (s37, 2 lines); nowrap | Manrope 120, lh 1.15, trk −3.6, white. **Weight varies:** s3 = 500 Medium, s8 = **600 SemiBold**, s37 = 500 Medium. It is stored in `content.style.titleWeight`. |
| Subtitle (content) | **left 279**; s3 top 588 (1 line), s8 top 588 (2 explicit lines), s37 top 686 (1 line); nowrap | Manrope 400, 64, white. s3/s37: lh 1.15, trk −1.92. **s8: lh 1.4, trk −1.28**. Stored in `content.style`. |

Ghost number treatment:
- The number sits in a 176px gutter (103 → 279) left of the title, on the **same top** as the title's first line, at the same size.
- It is translucent white (0.2) and uses Everett instead of Manrope.
- The left vertical rule at x 279 separates it from the title.

**Rule "type cage"** (the horizontal + vertical lines on s3): all lines are white, opacity 0.3, 1px (see `shared.md §5` for how a Y/X maps to pixels).

- **Horizontal rules**: 3 per title line, at offsets **+26, +79, +117** from each line-box top. They read as cap-height, x-height/mid and baseline guides for 120px Manrope. They start at **x −40** (bleed off the left edge) and run to a per-slide width.
  - s3: y **458, 511, 549**. width **1201** (→ x 1161). asset `s03/line-h.svg` 1201×1.
  - s8: y **458, 511, 549**. width **1456** (→ x 1416). asset `s08/line-h.svg` 1456×1.
  - s37 (2 lines, second line box at +138): y **383, 436, 474, 521, 574, 612**. width **1297** (→ x 1257). asset `s37/line-h.svg` 1297×1.
- **Left vertical rule** at the title's left edge, **x 279**:
  - s3/s8: top **431**, height **140** (title box top −1 → +2 below). Asset `line-v-a.svg` / `line-v.svg`, 140×1, rotated.
  - s37: top **356**, height **267** (`s37/line-v-a.svg` 267×1).
- **Right vertical rule(s)** at each title line's **right edge**:
  - s8: x **1389**, top 431, h 140.
  - s37: x **1150**, top 374, h 140 (line 1 end) and x **1027**, top 504, h 140 (line 2 end). Asset `s37/line-v-b.svg` 140×1.
  - **s3: none visible.** The node `511:28929` exists at x 1094, but its export is an empty 32×32 SVG and the screenshot shows no line. Do not draw it, unless design confirms it is an oversight.
- The horizontal rules extend past the title's right edge by a slide-specific amount (s3 +67, s8 +27, s37 +107 past the longest line). Use the exact values in `content/sNN.json → layout`. A generic fallback is to end ~30–100px past the longest title line.

### 3b. Section **level 2** (slides 10, 26, 31: nodes 511:29476, 511:29787, 511:30406)

Slides 26 and 31 are "instance-only frames": the frame holds `BG` plus one 1920×1080 `overflow: clip` instance ("29" / "30") of the L2 component. Its children are master nodes 405:13177–13185, 406:13205, 408:13333. Slide 10 is the same layout built from loose layers. **All three render identically apart from text.**

| Element | Geometry | Typography |
|---|---|---|
| Parent number (content: `02`) | **left 71.5, top 252.5**, nowrap | **Everett Regular 400, 60, lh 1.15, trk −1.8, white, opacity 0.2** |
| Parent section label (content: `Products and Pricing`) | **left 159.5, top 252.5**, nowrap | **Manrope Regular 400, 60, lh 1.15, trk −1.8, white, opacity 0.6** |
| Title (content) | **left 150, top 472**, nowrap | Manrope **SemiBold 600**, 120, lh 1.15, trk −3.6, white. s31 text has **double spaces** around "/" (`Trade  /  Institutional Crypto`) with `white-space: pre`. s10/s26 use single spaces. |
| Subtitle (content) | Figma inset 57.59% / 19.48% / 36.2% / 7.81% → **left 150, top 622, width 1396, height 67**; nowrap | Manrope 400, 48, lh 1.4, trk −0.72, white |

**Mini cage** around the eyebrow row. All lines are white, opacity 0.3, **0.5px stroke**, and occupy [Y−0.5, Y]:
- Horizontal rules from **x 0** to **x 728** (width 728) at y **265.5, 292, 311**. These are offsets +13, +39.5, +58.5 from the eyebrow top, i.e. exactly half the L1 offsets for the half-size text.
  - Assets: `s10/line-h.svg` (728×0.5, used for 265.5 and 311) and `s10/line-h-mid.svg` (728×0.5, y 292). The two are identical apart from the layer name.
- Vertical rules: x **159.5** (between number and label) and x **728** (right end of the cage). Both top **252**, height **70**. Asset `s10/line-v.svg` (70×0.5).
- The cage is fixed (same width 728) on all three slides because the parent label is identical.

### 3c. How L1 and L2 differ (summary)
| | Level 1 | Level 2 |
|---|---|---|
| Purpose | Opens a top-level section (01/02/03) | Opens a sub-section inside a parent section |
| Number | Own section number, **120px** Everett @0.2, inline left of title (x 103, same top) | **Parent's** number, **60px** Everett @0.2, small eyebrow at top-left (x 71.5, y 252.5) |
| Extra label | — | Parent section title, 60px Manrope 400 @**0.6**, at x 159.5 |
| Title | x 279, top 432 (or 357 for 2 lines), weight 500/600 | x **150**, top **472**, always 600, no cage around it |
| Subtitle | 64px, x 279 | **48px**, lh 1.4, x 150, top 622 |
| Rules | 1px cage around the **title** (horizontal bleed from −40, left and right verticals) | 0.5px mini cage around the **eyebrow** only, from x 0 to 728 |

---

## 4. `statement-highlights` (slide 7, node 511:29425)

Background `light`. Logo dark (79, 125). Footer black (79, 938). Accent bar.

| Element | Geometry | Typography |
|---|---|---|
| Statement title (content, 2 explicit lines; line 1 ends with a trailing space) | **width 1649, centered** (left 136; Figma `left: calc(50% + 0.5px)` → centre x 960.5), top 190 (17.59%), bottom 396 (63.33%) → height 206 | Manrope **600**, **90**, lh 1.15, trk **−3.6**, color **#204680**, `text-align: center`, `white-space: pre-wrap` |
| Body paragraph (content) | **width 1506, centered** (left 207, centre x 960), top **432** (40%), bottom 636 (41.11%) → wraps to 4 lines | Manrope **600**, 32, lh **1.6**, trk −0.32, #000, centered. Apostrophes are straight `'`. |
| Highlights card | see below | |

**Highlights card** (node 511:29429):
- Auto-layout row: `display: flex; align-items: center; gap: 120px; padding: 48px 60px; border-radius: 16px`.
- Size comes from content: **≈ 1293 × 227.2**. The render with its shadow is 1341×276, so the shadow adds 24px per side.
- Centered horizontally on x **960.5**, vertically on y **786** (`top: calc(50% + 246px)` with translate −50%). The box is therefore ≈ left 314, top 672.4.
- Background: `linear-gradient(142.8718519294768deg, rgb(44,112,216) 21.64%, rgb(19,27,38) 57.452%, rgb(250,115,18) 88.018%)`.
- Shadow: `filter: drop-shadow(0px 0px 12px rgba(0,0,0,0.08))`.
- All text is white (`Fixed/White`), Manrope **600**.
- **Repeats: 3 highlight columns.** Each column is a flex column with `gap: 8px` and `justify-content: center`.
  - Highlight title: 40, lh 1.4, trk −1.2, nowrap.
  - Highlight description: 28, lh 1.2, trk −0.28.
  - Col 1: description has an explicit break `Official Circle ⏎and Tether partner`, with a trailing space and `white-space: pre`. The whole column is nowrap.
  - Col 2: description **width 273**, explicit break `PH live, 7 more ⏎rolling through 2026`.
  - Col 3: description **width 336**, wraps naturally as "Payments, trading, and / treasury in one stack".

---

## 5. `product-index` (slide 9, node 511:29454)

Background `light`. Logo dark (79, 125). Footer black (79, 938). Accent bar.

**Left column:**
| Element | Geometry | Typography |
|---|---|---|
| Title runs (content) | left **79** (4.11%), top **440** (40.74%), width 533, height 83; nowrap | Manrope **600**, 72, lh 1.15, trk −2.16. Runs: `Pay. ` **#204680**, `Move. ` **#1F7AFF**, `Trade` **#FA7312**. Trailing spaces are inside runs 1–2. |
| Lede (content) | left 79, top **540** (50%), width **661** (right 61.46%), bottom 741 → wraps to 3 lines ("Eight products. Three pillars. / Pick what fits your business. / We plug in the rest.") | Manrope **500**, 48, lh 1.4, trk −1.44, #000 |

**Right column: 3 pillars (repeat), absolutely positioned:**

**Pillar header** (component "Component 17/18/19"):
- Flex row, `gap: 24px`, `align-items: center`, at **left 999**. All 40px, lh 1.15, trk −1.2.
  - Number: **Everett Light 300**, #000, **width 66**.
  - Title: Manrope **700**, pillar color, `white-space: pre`. Titles have **double spaces around "/"**.
  - The title starts at x 999+66+24 = **1089**.
- Header tops: **182 (01), 596 (02), 778 (03)**.

**Product list**:
- Flex column, `gap: 24px`, at **left 1089** (aligned with the header title), **width 733**. The list top is header top + **76** (header box 46 + 30 gap): **258 / 672 / 854**.
- **Product row** (master 405:13092): flex row, `gap: 48px`, `align-items: center`, 24px, lh 1.4 (row height 33.6), #000.
  - Name: Manrope **700**, trk −0.72, **width 230**.
  - Description: Manrope **400**, trk 0, nowrap. The description therefore starts at x 1089+230+48 = **1367**.
- Row pitch is 57.6 (33.6 + 24).
- Pillar 1 has 5 rows (ends y 522). Pillar 2 has 1 row (ends 705.6). Pillar 3 has 2 rows (ends 945.2).
- Gaps between the end of a list and the next header are 74 (01→02) and 72.4 (02→03). Figma places them absolutely and does not compute them, so use the exact header tops above.

| Pillar | Number | Title | Color |
|---|---|---|---|
| 1 | 01 | `Accept  /  Payments` | #204680 |
| 2 | 02 | `Move  /  Cross Border` | #1F7AFF |
| 3 | 03 | `Trade  /  Institutional Crypto` | #FA7312 |

The copy "sorted by sellert" (typo) is verbatim from Figma.

---

## 6. `cta-contact` (slide 39, node 511:31637)

Background **`dark-navy`** (`linear-gradient(139.0856182740788deg, rgb(6,15,31) 30.321%, rgb(25,22,22) 87.755%)`) + BG overlay. Logo white standard (79, 125). Footer white (79, 938).

**Left column:**
| Element | Geometry | Typography |
|---|---|---|
| Title (content) `Let’s get you` / `set up.` (curly ’) | left **151**, top **310**, 2 explicit lines (box 310–586), nowrap | Manrope 500, 120, lh 1.15, trk −3.6, white |
| Lede (content, 2 explicit lines) | left 151, top **639**, nowrap | Manrope 400, 48, lh 1.4, trk −1.44, white |

**Right column: 2 contacts (repeat), at left 1078:**
| Element | Geometry | Typography |
|---|---|---|
| Label 1 | top **343**, **width 554** (wraps to 2 lines → ends 425.8) | Manrope 400, 36, lh 1.15, trk −1.08, white |
| Email 1 | top **449**, nowrap | Manrope **700**, 48, lh 1.4, trk −1.44, **#EFA023** |
| Label 2 | top **653**, width 554 (1 line) | as label 1 |
| Email 2 | top **718** | as email 1 |

- Label bottom → email top is ≈ 23–24.
- The contacts are absolutely placed. Label pitch is 310 and email pitch is 269. They are not evenly auto-spaced.

**Rule cage** around the title. All lines are white @0.3, 1px:
- Horizontal: x **−168**, width **1052** (→ x 884). y **336, 389, 427, 474, 527, 565** (offsets +26/+79/+117 per line box, same system as section L1). Asset `s39/line-h.svg` 1052×1.
- Left vertical: x **151**, top 309, h **267** (`s39/line-v-a.svg` 267×1).
- Right verticals: x **813**, top 320, h **128** (end of line 1; `s39/line-v-b.svg` 128×1) and x **504**, top 457, h **140** (end of line 2; `s39/line-v-c.svg` 140×1).

---

## 7. `closing` (slide 40, node 511:31657)

Background **`dark-navy`** + BG overlay. Logo white standard (79, 125). Footer white (79, 938).

| Element | Geometry | Typography |
|---|---|---|
| `Thank you` (content) | left **253**, top **421**, nowrap (box 276 tall) | Manrope **400 Regular**, **240**, lh 1.15, trk **−7.2**, white |

**Rule cage**, white @0.3, **2px stroke**. A rule at Y occupies [Y−2, Y]:
- Horizontal: x **−385**, width **2104** (→ x 1719). y **473, 579, 655**. These are offsets +52/+158/+234, i.e. 2× the 120px offsets. Asset `s40/line-h.svg` 2104×2.
- Left vertical: x **253**, top 419, h **278** (`s40/line-v-a.svg` 278×2).
- Right vertical: x **1319** (end of "Thank you"), top 441, h **256** (`s40/line-v-b.svg` 256×2).

---

## Cross-pattern notes for the engineer
- The **title rule cage** is one reusable decoration across section-L1, cta-contact and closing. The offsets scale with font-size: (26, 79, 117) / 120 → (0.2167, 0.6583, 0.975) × font-size from each line-box top, with line pitch = 1.15 × font-size. Section-L2 uses the same ratios at 60px.
  - Bleed start: −40 for L1, −168 for CTA, −385 for closing.
  - End, vertical heights and stroke weight are slide-specific. They are listed per slide in `content/sNN.json → layout`.
- Section L1 title weight and subtitle metrics differ between s3/s37 and s8. They are carried in `content/sNN.json → style`.
- `dark` (s1–s37) and `dark-navy` (s39, s40) differ only in the base gradient. The BG blob overlay is the same file.
