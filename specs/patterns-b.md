# Patterns B: key-numbers, timeline, logo-wall, card-grid, feature-cards

Source: Figma file `PhmKTV0Z0gwAKs8MNxEgcI`. All frames are 1920×1080. All coordinates are absolute frame px (x, y, w, h) unless marked "rel." (relative to the parent box).
Fonts: `Cns Manrope` (weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold), `TWK Everett` (400 Regular, 500 Medium), `Encode Sans Semi Expanded` (only inside the ALMOND logo on s06).
Notation: `size/line-height/tracking`. A unitless line-height is a multiplier, and `normal` means the font's default line-height. Tracking is in px, and Figma's % tracking has already been converted (for example −3% of 72px = −2.16px).
Content (strings, values, colors per item) lives in `specs/content/sNN.json`. Verbatim reference code is in `specs/raw/sNN.tsx`.

## Shared chrome per slide (handled by another agent)

| Slide | Background | Logo (Icon/Logo, 222.45×52.341, centred at x 190.22, y 151.17, so top-left ≈ 79,125) | Confidential footer (79,938 426×33) | Accent bar (0,1069 1920×11) | BG overlay component `511:26153` (full-frame SVG) |
|---|---|---|---|---|---|
| s04 | page gradient | yes | yes | yes | **no** |
| s05 | page gradient | yes | yes | yes | **yes** |
| s06 | page gradient | yes | yes | yes | no |
| s30 | page gradient | yes | yes | yes | no |
| s38 | page gradient | yes | yes | **NO accent bar** | **yes** |

Page gradient (all five slides): `linear-gradient(139.0856deg, rgb(240,240,240) 30.321%, rgb(238,240,238) 87.755%)`.
On s38 the logo is drawn above the cards, and only the USDT coin sits above the logo.

---

## 1. key-numbers (slide 4, node `556:35037`)

### Layout
Content container "Component 8": (79, 52, 1785×947). Every inner inset below has been resolved to absolute values.

| Element | Geometry | Typography / style | Content? |
|---|---|---|---|
| Left text group | (79, 214, 678×624) | — | layout |
| Title "At a glance" | (79, 214, 356×83) | Manrope 600, 72/1.15/−2.16, `#204680`, nowrap | content |
| Subtitle | (79, 314, 678×201) | Manrope 600, 48/1.4/−1.44, `#000`, wraps to 3 lines | content |
| Callout bar | x 79–91, y 542, 12×266 | solid black bar (`divider-vertical-line.svg` is a 266×12 black line with a 12px stroke, rotated 90°). Easier: `div` 12×266 `#000` | fixed |
| Callout text | (126, 561, 526×225) | 32/1.4, black. Line 1 Manrope **700** ("One integration, full coverage:  ", which includes 2 trailing spaces), lines 2–5 Manrope 400. Each line is its own paragraph (hard breaks), `white-space: pre-wrap` | content |
| Stat card A (consumer) | (794, 146, 509×618) | see Stat card | content |
| Stat card B (enterprise) | (1339, 146, 503×618) | see Stat card | content |
| Gap between cards | 36px | | |
| Inline stats row 1 | flex row, `justify-content:flex-end`, `align-items:center`, gap **60**, spans x 374→1842 (w 1468), **vertical centre y = 873.7** | see Inline stat (primary) | content |
| Inline stats row 2 | same box (x 374→1842), gap **61.2**, **vertical centre y = 963.7** | see Inline stat (secondary) | content |

### Stat card (component)
- Box: border `1px solid #000`, radius **24**, padding **36** measured from the outer edge (Figma's inside stroke, so in CSS use `padding:35px; border:1px` or `box-shadow: inset 0 0 0 1px #000` with `padding:36px`), `display:flex; align-items:center`. No fill: the page gradient shows through.
- Inner box: 437×546 (card A) / 431×546 (card B). Inner origin = card origin + (36, 36): A (830, 182), B (1375, 182).
- Inner positions are rel. to the inner box. **Card A has a 6px left offset on the icon, label and description; card B uses 0.** The value sits at x 0 in both.
  - Icon 90×90 at (6|0, 0).
    - Consumer `icon-verified-user.svg` (85.89×86.25) placed at rel. (3.18, 2.81) inside a 90×90 box with `overflow:clip`.
    - Enterprise `icon-verified-business.svg` (103.31×97.31) placed at (0, 0) inside a 90×90 box. **It overflows** to the right and bottom (inset 0 −14.79% −8.13% 0). Do not clip it.
  - Value at (0, 77), 120px, line-height 1.4 (168px), nowrap.
    - Card A "5M+": colour `#fa7312`, tracking −3.6. The "5" is **TWK Everett 400**, and "M+" is **Manrope 600**.
    - Card B "2,000+": **TWK Everett 400**, colour `#1f7aff`, tracking **−6**. Its box has `right:23px` (does not matter because of nowrap).
  - Label block at (6|0, 243, 251×115):
    - Eyebrow at rel. top 0: Manrope **800**, 20/1.2/+1.4, black, **opacity 0.5**, uppercase text as given ("CONSUMER SIDE" / "ENTERPRISE SIDE").
    - Label at rel. top 39 (33.91% of 115): Manrope 600, 32/1.2/−0.32, black, 2 lines with a hard break.
  - Description at (6|0, 390), w 431: Manrope 400, 28/1.4/−0.28, black, wraps to 4 lines.

### Inline stat, primary (row 1)
- Item: `display:flex; align-items:center; gap:20.4px`. Height 71 (item 1) or 71.4 (items 2–3).
- Value: line-height 1.4, nowrap, colour `#17191d`.
  - "~90%": Manrope **600**, 60px, tracking −1.8.
  - "26": Manrope **700**, **70px**, tracking −2.1.
  - "$28B+": Manrope **700**, 60px, tracking −1.8. It is three spans ("$", "28", "B+") with identical styling.
- Label column (`flex-col`):
  - Title: Manrope 600, 23.8/1.2/−0.238, `#17191d`, nowrap.
  - Note: Manrope 600, 12/1.4/−0.12, `#5b6572`, fixed width (169 / 195).
- Item 3 has no note. Its label is a single text box, w 206.55, that wraps to 2 lines.
- Item 1 has a fixed width of 354. Items 2 and 3 hug their content.
- Item 1's label column uses `justify-content:center`.

### Inline stat, secondary (row 2)
- Item: flex, `align-items:center`, gap **20**, height 57.12 (item 3 is 57 high with a fixed width of 289).
- Value: Manrope 700, 40.8/1.4/−1.224, `#17191d`, nowrap.
- Label: Manrope 600, 19.04/1.2/−0.1904, `#17191d`.
  - Widths: 211.48 / 182 (both wrap to 2 lines).
  - Item 3 is "Trading volume" + `<br>` + "processed in 2025", nowrap.

### Layout comparison: 511:28932 (older "$42B+" frame) vs 556:35037
The geometry is **identical**: same container, card insets, row positions, gaps and callout. The differences are typographic and in content:
- Row 1 values use **TWK Everett 500, 51px**, tracking −1.53, colour black (`#000`), not Manrope 60/70 in `#17191d`.
  - Item 1 is the word "Largest" in Manrope 600 51px, with a 2-line label at w 264.35.
  - Item 1 is w 467.5 and its height is 71.4.
- Notes use colour `#828282`, not `#5b6572`.
- Row 2: all text is `#585858`, and values use TWK Everett 500 40.8px.
- Card B value "1,800+" has `right:55px` (vs 23).
- Content: $42B+ / $12B+ / $7B+ / $5B+ / 1,800+, and "Stablecoin volume" (w 172).

### Text differences: 560:35123 vs 556:35037 (reported only, not chosen)
Values, cards, title, subtitle and callout are identical. The differences:
1. Row 1 item 1 note: "**s**imilarweb average DAU for Android users in 2025" (lower-case s) vs "Similarweb…".
2. Row 1 item 2 note: "**i**ncludes approved and in-progress regulatory applications." (lower-case i) vs "Includes…".
3. Row 2 labels are restructured into title + note (same note style as row 1: 12/1.4/−0.12 `#5b6572`; title 19.04px Manrope 600 `#17191d`; all nowrap):
   - "$12B": "Local payments volume" / "fiat collections and disbursements" (556 has "Local payments volume processed in 2025")
   - "$8.5B": "Stablecoins volume" / "trading and on-chain flows" (556 has "Stablecoins volume processed in 2025")
   - "$7.5B": "Trading volume" / "non-stablecoin trading and on-chain flows" (556 has "Trading volume⏎processed in 2025")
4. Layout side effects: row 1 item 1 has no fixed width (556 uses 354), and row 2 item 3 has no fixed width (556 uses 289). In 560, all row 2 items are 57.12 high.

---

## 2. timeline (slide 5, node `511:28977`)

### Layout
| Element | Geometry | Style | Content? |
|---|---|---|---|
| Title "Our story" | (79, 440, 302×83) | Manrope 600, 72/1.15/−2.16, `#204680` | content |
| Subtitle | (79, 540, 578×201) | Manrope 600, 48/1.4/−1.44, black, 3 lines | content |
| Axis line | vertical at x **1242**, y 160→1080 (920 long), 1px | stroke `#9E9E9E` (`timeline-axis-line.svg`, rotated 90°); a 1px `div` is fine | fixed |
| Markers | 13×13 circles, `#1F7AFF` (`marker-dot.svg`), left x **1236** (centred on the axis) | y tops: 154, 278, 341, 483, 640, 685, 727, 814, 851 | per item |
| Year→text gap (right items) | year box left x **1152**, gap **170** to the description (2015 uses **175**) | | |
| Left-item block | `flex; justify-content:flex-end; gap:48px`; text then year; text right-aligned; right edge ≈ 1216 | | |

### Timeline item (component)
- **Year**: TWK Everett 400, 24px, line-height normal, colour `#17191d` (the 2026 year is `#474747`), nowrap.
- **Right-side text** (description): Manrope **500**, 24px, line-height normal, black, 2 lines with a hard break.
- **Left-side text**: Manrope **700**, 24px, line-height normal, black, `text-align:right`, 1–2 lines.
- **Caption** (optional, under right text): Manrope 600, 18px, line-height normal, colour `#6482a5`. Tracking is **2.16** for 2026 and 2015, and **1.44** for 2025. Absolute positions:
  - 2026: (1388, 209)
  - 2025: (1388, 335)
  - 2015: (1385, 879)
- Exact boxes per entry (y = top of the text row; a marker sits ~10–12px below the year top):

| Year | Kind | Box |
|---|---|---|
| 2026 | right | Component 13 at (1152, 142): year, then gap 170, then desc |
| 2025 | right | Component 12 at (1152, 267): gap 170 |
| 2024 | left | (825, 333, w 391): justify-end, gap 48 |
| 2022 | left + right | Frame at (821, 473): [left text] gap 48 [year 2022] gap 170 [right desc] |
| 2021/2018 | right with bracket | Component 14 (1152, 633, 436×113). Details below the table. |
| 2019 | left | (819, 675, w 391): justify-end, gap 48 |
| 2015 | right | Component 15 (1152, 804): gap **175** |
| 2014 | left | (896, 841, hug): justify-end, gap 48 |

Component 14 (the 2021/2018 bracket entry) contains:
- "2021" at rel. (0, 0) and "2018" at rel. (0, 84).
- Description "Pivot to fiat / payment solutions" at rel. (233, 16), which is abs. (1385, 649).
- Dashed bracket `bracket-2018-2021.svg` (59.5×89, stroke black, dash 4 4, opacity 0.4, r 24 corners) at abs. (1217, 646, 59×88).
- Two 13px markers at abs. (1236, 640) and (1236, 727).

There is also an empty "Component 16" at (1152, 381, 380×27). It has nothing visible, so ignore it.

### Flag track (decoration with content flags)
Three stacked 48px-wide pills at x **1299**. Each has `border-radius: 24px 24px 0 0` and fills top to bottom:
- Pill A (1299, 137, 48×204): `linear-gradient(to bottom, #f9f9f9 16.834%, #4f92a0 66.08%)`, **opacity 0.2**, no shadow.
- Pill B (1299, 278, 48×297): `linear-gradient(to bottom, #f6d8ef 0%, #94ccfe 51.771%)`, shadow `0 -2px 8px rgba(0,0,0,0.15)`.
- Pill C (1299, 429, 48×667): runs off the bottom edge (to y 1096), so clip to the frame. Fill `linear-gradient(to bottom, #fff 33.137%, rgba(243,243,243,0) 97.133%)`, same shadow.

Flags are 36×36 circles (PNG 512×512, `object-fit:cover`) at x **1305**, top to bottom:
- EU 146, SG 190, HK 234
- BR 286, AR 330, AU 374 (these three are a group)
- PH 440, TH 484

Vertical pitch is 44; there is a 52px jump between groups, and 66 from AU to PH.

Z-order, bottom to top:
1. BG overlay
2. Pill A
3. SG and HK flags
4. Pill B
5. Axis
6. Text
7. Markers
8. Pill C
9. PH and TH flags
10. BR, AR and AU flags
11. EU flag
12. Accent bar

---

## 3. logo-wall (slide 6, node `511:29022`)

### Layout
| Element | Geometry | Style |
|---|---|---|
| Title "Infrastructure" | (79, 225, 457×83) | Manrope 600, 72/1.15/−2.16, `#204680` |
| Body | (79, 332, 497×550) | Manrope 600, **36/1.4/−1.08**, black, ~10 lines |
| **Dark panel** | (616, 83, 1233×941) | radii **TL 12, TR 12, BR 210, BL 12**; fill `linear-gradient(193.9064deg, rgb(19,27,38) 8.7004%, rgb(128,63,17) 20.704%, rgb(32,70,128) 29.938%, rgb(19,27,38) 83.249%, rgb(30,27,27) 104.73%)`; inner shadow `inset 0 -24px 24px rgba(0,0,0,0.25)` |
| Group stack | (644, 121, 1177×866), `flex-col`, gap **24** | |
| Bottom row | y 534, `flex-row`, gap **24**: left column w 639 (`flex-col`, gap 24), then the PSP group w 514 | |

### Logo group panel (component, repeated 4×)
Structure: header text, an outline frame, and a logo flow. In Figma all three are overlaid in one grid cell, so the offsets below are from the group's top-left.
- **Outline frame**: 1px white stroke, radius 12, with a **gap in the top edge** where the header sits. It is provided as SVGs: `panel-*.svg`.
  - Opacity **0.4** for cross-border, **0.2** for the other three.
  - CSS alternative: a `border: 1px solid rgba(255,255,255,α)` box with a page-dark mask behind the header. The SVG is exact, so prefer it.
- **Header**: white, centred, line-height 1.4.

| Group | Group box (abs) | Header | Header box (rel) | Outline (rel; top-edge gap x-range) | Logo flow (rel) |
|---|---|---|---|---|---|
| Cross-border Partners | (644,121) 1177×389 | Manrope 700, **28px**, tracking −0.42 | x 414.9, y 0, w 347.2, h 36.3 | (0, 21.4) 1177×367.6; gap 374.0–803.0 | (28, 44) w 1119, h 321; `flex-wrap`, gap **36**, `justify-content:center`, `align-items:center`, `align-content:center` |
| Global & Local Payment Networks | (644,534) 639×242 | Manrope **600**, 20px, tracking −0.3 | x 73.2, y 0, w 494 | (0, 14) 639×228; gap 88.5–550.5 | (46.2, 49) w 524.6, hug height; gap **36 row / 42 col**, centred |
| Stablecoin Issuers | (644,800) 639×187 | Manrope 700, 20px, tracking −0.3 | x 73.2, y 0, w 494, h 19.5 | (0, 9.73) 639×177.3; gap 182.2–458.1 | (96, 34) w 447, h 138; gap **20 row / 42 col**, centred |
| Payment Service Providers | (1307,534) 514×453 | Manrope 700, 20px, tracking −0.3 | x 58.8, y 0, w 397.4, h 30.1 | (0, 15.05) 514×437.95; gap 103.2–409.8 | (45.4, 52.6) w 422.1, h 375.7; gap **48 row / 42 col**, centred |

Wrapping in the design (the content JSON lists logos in this flow order):
- Cross-border wraps 5 / 6 / 6:
  - Remitly, MoneyGram, Thunes, veem, LuLu
  - bcremit, stables, WorldRemit, TALA, SBI Remit, ALMOND
  - xendit, FAZZ, index, LIGHTNET, TransFi, ria
- Networks wraps 3 / 4:
  - Swift, SEPA, PayID
  - Pix, InstaPay, PESONet, NIBSS
- Stablecoin wraps 2 / 2:
  - Circle, tether
  - Paxos, First Digital
- PSP wraps 4 / 2 / 3 / 3:
  - BDO, Mastercard, VISA, Alipay
  - PayPal, xendit
  - paymongo, paynamics, MPay
  - QPay, GCash, PayNet

### Logo item (component)
- A fixed `w×h` box per logo (values in `s06.json`).
- Three render modes:
  - `fit:"fill"`: SVG at exactly w×h.
  - `fit:"cover"`: `object-fit:cover`. Two logos also need `object-position:bottom`: WorldRemit and TransFi.
  - `crop`: box `overflow:hidden`, and the `<img>` is absolutely positioned with the given %-based `width`, `height`, `left`, `top`. This reproduces Figma's image crop exactly.
- **Composites**:
  - MoneyGram (icon + wordmark), Circle (icon + wordmark) and ALMOND FINTECH (two text runs + icon) are made of overlapping parts. Part offsets are in the JSON.
  - A 1× flattened PNG of each composite is also provided (`*-composite.png`) as a fallback.
- **Chip logos** (MPay, QPay): white rounded chip, 77×30, radius 4, padding 4, content centred, with the logo inside.
- Logos are already white or coloured for a dark background. Do not recolour them.

---

## 4. card-grid (slide 30, node `511:30387`)

### Layout
| Element | Geometry | Style |
|---|---|---|
| Section label "Products and Pricing" | (1550, 145) | Manrope 700, 28/1.15/−0.84, `#757575`, nowrap |
| Title "Corridor Readiness" | (79, 323) | Manrope 700, 48/1.4/−1.44, black, nowrap |
| Subtitle | (79, 398, w 439) | Manrope **400**, 48/1.4/−1.44, black; wraps after "live." to 2 lines |
| Body | (79, 592, w 426) | Manrope 500, 28/**1.6**/−0.42, `#363636`, 6 lines |
| Grid | (719, 266, w 1112) | `flex-wrap`, gap **24** (row and column), 4 columns × 2 rows of 260px cards; **group filter** `drop-shadow(0 0 6px rgba(0,0,0,0.08))` on the whole grid |

The resulting card height is ≈ 337 (content-driven), so row 2 starts at y ≈ 627.

### Country card (component)
- Box: w **260**, `flex-col`, `align-items:center`, gap **24**, padding **24**, border `1px solid #dbdbdb`, radius **12**.
- Fill: `linear-gradient(155.4799deg, #ffffff 13.016%, #eeeeee 105.99%)`.
- Flag: 65×65 (circle PNG, `object-fit:cover`), `filter: drop-shadow(0 0 6px rgba(0,0,0,0.25))`.
- Text block: `flex-col`, gap 8, full width, line-height 1.4, black.
  - Country name: Manrope 700, 28px, tracking −0.84, centred.
  - Sub-block: `flex-col`, `align-items:center`, gap 4, nowrap.
    - Rail: Manrope 700, 16px, tracking −0.48.
    - Speed: Manrope 400, 12px, tracking −0.36.
- Status list: `flex-col`, gap **12**. Its width is set by the 200px row (the first row is `w-full` of the list, the second is a fixed 200).

### Status row and chip (component)
- Row: w **200**, bg `#fff`, border `1px solid #ececec`, radius 4, padding **8px 12px**, `display:flex; justify-content:space-between; align-items:center`, **opacity 0.8** (on the whole row, chip included).
- Row label: Manrope 700, **10px**, line-height 1.4, tracking 0.1, **uppercase** (source text "Collections" / "Disbursements"), black.
- Chip: padding **2px 8px**, radius 4. Text: Manrope 700, 12px, line-height 1.4, tracking **0.72**, white, nowrap.

| Variant | Text | Background |
|---|---|---|
| live | `LIVE` | `#f61414` |
| q2 | `2026Q2` | `#f77b15` |
| q3 | `2026Q3` | `#1449f6` |

---

## 5. feature-cards (slide 38, node `511:31619`)

### Layout
| Element | Geometry | Style |
|---|---|---|
| Title | box (588, 213, 744×67), text centred horizontally | Manrope 700, 48/1.4/−1.44, black, nowrap |
| Cards | 5 × (300×475), x = **114, 462, 810, 1158, 1506** (pitch 348, gap 48) | |
| Stagger | odd cards (01, 03, 05) at y **331**; even cards (02, 04) at y **391** (+60) | |

### Feature card (component)
- Box: 300×475 fixed, border `1px solid #000`, radius **8**, padding **60 30 30 30** (top, right, bottom, left), `flex-col`, gap **36**.
- Fill: `linear-gradient(123.1447deg, #ffffff 50%, #fbfbfb 94.311%)`.
- Filter: `drop-shadow(0 0 6px rgba(0,0,0,0.12))`.
- Number: absolute, **right edge at x 281** (19px from the card's right edge), top 7. TWK Everett 500, 24/1.4/−0.24, `#efa023`, right-aligned.
- Title: Manrope 500, 32/1.4/**−0.8**, black, fills the content width (240).
  - **Every title occupies 3 lines (134.4px)**. Figma pads single- or two-line titles with an extra empty (ZWSP) line, and card 01 wraps naturally to 3 lines.
  - Implement this as `min-height: 134.4px` (3 × 44.8) so the descriptions line up at card-top + 230.4.
- Description: Manrope 500, 20/1.4/−0.2, `#3d3d3d`, width 240. It contains explicit `\n` breaks in cards 03 and 05 (`white-space: pre-line`).

### Decoration: 3D coins (PNG 3000×3000 RGBA, ~8.7–11.4 MB each; consider resizing or optimising at build time)
| Layer | Glyph | Box (x, y, size) | Z |
|---|---|---|---|
| THB_6 | silver ฿ | (−55, 152, 300) | behind cards |
| USDT_5 | ₮ green | (810, −54, 231) | **topmost** |
| PHP_4 | ₱ blue/orange | (1308, 192, 293) | behind cards |
| USDC_3 | $ blue | (1722, 577, 294) | behind cards |
| THB_3 | "C" coin (looks like PHPC) | (436, 776, 357) | behind cards and footer |

The coins bleed off the frame, so clip at 1920×1080.

Paint order:
1. Page gradient
2. BG overlay
3. THB_3
4. Title
5. Footer
6. PHP_4
7. USDC_3
8. THB_6
9. Cards 01–05
10. Logo
11. USDT_5
