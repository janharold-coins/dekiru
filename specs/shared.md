# Shared chrome + tokens

Figma file `PhmKTV0Z0gwAKs8MNxEgcI`. Every slide is a 1920×1080 frame. All coordinates are absolute px in that frame. Origin is top-left.
Verbatim Figma reference code for each slide is in `specs/raw/sNN.tsx`. Asset URLs in those files expire. Use the local `/figma/...` paths instead.

---

## 1. Slide backgrounds

There are three base fills. A slide uses exactly one. The dark variants also get the `BG` overlay.

| Variant | Base fill (on the 1920×1080 frame, CSS `background-image`) | BG overlay | Used on |
|---|---|---|---|
| `dark` (Figma style "bgslideblack") | `linear-gradient(144.83648150139365deg, rgb(23, 25, 29) 17.147%, rgb(20, 20, 20) 72.199%)` → #17191D → #141414 | yes | 1, 3, 8, 10, 26, 31, 37 |
| `dark-navy` | `linear-gradient(139.0856182740788deg, rgb(6, 15, 31) 30.321%, rgb(25, 22, 22) 87.755%)` → #060F1F → #191616 | yes | 39, 40 |
| `light` | `linear-gradient(139.0856182740788deg, rgb(240, 240, 240) 30.321%, rgb(238, 240, 238) 87.755%)` → #F0F0F0 → #EEF0EE | no | 2, 7, 9 |

### BG overlay: instance "BG" (component node `511:26153`)
- Asset: `/figma/shared/bg-dark.svg`. Intrinsic size 1920×1080, `preserveAspectRatio="none"`.
- Position: `left:0; top:0; width:1920px; height:1080px`. It sits directly above the base fill and below all other content.
- It draws four blurred radial-gradient blobs (feGaussianBlur stdDeviation 35/40/45/50, with opacity 0.5–0.7) inside a 1920×1080 alpha mask. Colors: orange #FA7312/#D06111/#803F11 at bottom-left, blue #0057F4/#003488/#225CB4/#193155 at top-right.
- The export is identical on every dark slide; only the mask/filter IDs differ. Use the single shared file.
- The SVG includes its own filters, so you do not need CSS `filter` or `backdrop-filter`.

### Light background
- Light slides have no image overlay. The fill is the CSS gradient only.
- Slide 2 has an empty frame "01B2" (`511:28912`, 2392×1342 at −90,−198). Its export renders as the flat background (pixel range 236–241), and its 4 child raster fills are not visible. **Do not render it.**

---

## 2. Logo: "Icon/Logo" (inner node `738:2734`, "Group 54416")

The wordmark "coins.ph" has an orange dot (#EFA023) over the "i". The letters are white on dark slides and #050505 on light slides.

| Asset | File | Intrinsic (root width×height) | Letter fill |
|---|---|---|---|
| White, large (cover only) | `/figma/shared/logo-white.svg` | 299.41 × 71.0006 | `white` + dot `#EFA023` |
| White, standard | `/figma/shared/logo-white-sm.svg` | 220.725 × 52.3417 | `white` + dot `#EFA023` |
| Dark, standard | `/figma/shared/logo-dark.svg` | 220.725 × 52.3417 | `#050505` + dot `#EFA023` |

The Figma wrapper box is slightly wider than the SVG because of the inner `inset: 0 0.78% 0 0`. The SVG itself is left-aligned in the box. Render the `<img>` at its intrinsic size at these positions:

| Where | Wrapper box (Figma) | `<img>` left / top / w×h |
|---|---|---|
| Cover (slide 1) | 301.75×71, centre (231, 117.5) | **left 80.125, top 82**, 299.41×71 |
| All other slides (dark and light) | 222.45×52.341, centre (190.22, 151.17) | **left 79, top 125**, 220.725×52.342 |

---

## 3. Footer: "Strictly Private And Confidential" (component `394:11816` / text `394:11693`)

- Text: `Strictly Private And Confidential`. This is fixed text.
- Font: **Cns Manrope Regular (400), 24px, line-height `normal`, letter-spacing 2.4px (= 0.1em)**. `white-space: nowrap`.
- Box: 426×33.
- Color: `white` on dark and dark-navy slides. `black` (#000) on light slides.
- Position:
  - Slide 1 (cover): **left 81, top 981**. This is the only exception.
  - Every other slide: **left 79, top 938**. This includes 2, 3, 7, 8, 9, 10, 26, 31, 37, 39, 40.

---

## 4. Accent color bar: "Accent color" (component `511:26109`)

- Appears **only on light slides** (2, 7, 9). It is not on dark slides.
- Position: **left 0, top 1069, width 1920, height 11**. It is flush with the bottom edge.
- Three stacked rectangles. Later ones paint over earlier ones:
  1. `#1F7AFF` (var `Core/Blue`): x 0 → 1920 (full width)
  2. `#204680` (var `Base/Blue/Blue 800`): x 464 → 1896 (CSS `inset: 0 1.25% 0 24.17%`)
  3. `#FA7312` (var `Base/Orange/Orange 500`): x 867 → 1835 (CSS `inset: 0 4.43% 0 45.16%`)
- Visible result, left to right: blue 0–464 · navy 464–867 · orange 867–1835 · navy 1835–1896 · blue 1896–1920.
- Asset: `/figma/shared/accent-bar.svg` (1920×11). Figma's raw export of this component included canvas and page chrome (a #1E1E1E rect plus the parent page frame). The shipped file keeps **only the three rects, with the exact x/width/colors from that export**. Building it as three absolutely positioned CSS divs gives the same result and is preferred.

---

## 5. Decorative rule lines (section / CTA / closing)

These are hairlines built from Figma `Line` nodes, exported as SVGs (`<line stroke="white" opacity="0.3">`):
- Stroke is `white` at **opacity 0.3**.
- Stroke weight by pattern: section L1 = **1px**, CTA (s39) = **1px**, section L2 = **0.5px**, closing (s40) = **2px**.
- **Horizontal rule** at Figma `top: Y` covers y ∈ [Y − stroke, Y]. The wrapper is `h-0` with an inner `inset-[-1px_0_0_0]`, so the line sits just above Y.
- **Vertical rule** at Figma `left: X, top: T, height: H` is a horizontal line rotated −90°. It covers x ∈ [X − stroke, X], y ∈ [T, T+H].
- Equivalent CSS: `background: rgba(255,255,255,0.3)` on a div of the stroke thickness. It is pixel-identical to the SVGs.
- Exact geometry per slide is in `patterns-a.md` and in `content/sNN.json → layout`.

---

## 6. TOKENS

### Colors
| Hex / value | Figma variable | Where used |
|---|---|---|
| `#FFFFFF` | `Fixed/White` | All text on dark slides; highlight card text (s7); logo letters (dark); rules (at 0.3 opacity) |
| `#000000` | — | Body text on light slides (agenda, s7 body, s9), footer on light |
| `#050505` | — | Logo letters, dark version |
| `#EFA023` | — | Logo dot (all logos); CTA email addresses (s39) |
| `#1F7AFF` | `Core/Blue` | Accent bar; "Move." run (s9); pillar 02 title (s9) |
| `#204680` | `Base/Blue/Blue 800` | Accent bar; s7 statement title; "Pay." run + pillar 01 title (s9) |
| `#FA7312` | `Base/Orange/Orange 500` | Accent bar; "Trade" run + pillar 03 title (s9); BG blob |
| `#17191D` → `#141414` | — | `dark` base gradient |
| `#060F1F` → `#191616` | — | `dark-navy` base gradient (s39, s40) |
| `#F0F0F0` → `#EEF0EE` | — | `light` base gradient |
| `rgb(44,112,216)` #2C70D8 → `rgb(19,27,38)` #131B26 → `rgb(250,115,18)` #FA7312 | — | Highlight card gradient (s7): `linear-gradient(142.8718519294768deg, rgb(44,112,216) 21.64%, rgb(19,27,38) 57.452%, rgb(250,115,18) 88.018%)` |
| `rgba(0,0,0,0.08)` | — | Highlight card shadow: `filter: drop-shadow(0px 0px 12px rgba(0,0,0,0.08))` |
| `rgba(255,255,255,0.3)` | — | Rule lines |

Opacity treatments:
- Ghost section number: white at **0.2**.
- L2 parent-section label: white at **0.6**.
- Agenda numbers: black at **0.4**.

### Font families (exact Figma names)
- **`Cns Manrope`**: the main UI/display face. It is a custom Manrope build. Weights used: Regular 400, Medium 500, SemiBold 600, Bold 700.
- **`TWK Everett`**: used for numerals only. Weights used: Ultralight 200 (agenda numbers), Light 300 (product-index numbers), Regular 400 (section ghost numbers).
- Figma code refers to them as `font-['Cns_Manrope:Medium']` and `font-['TWK_Everett:Ultralight']`.
- The repo has no font files yet. The engineer must supply them, or fall back to Manrope (Google) and a substitute for Everett.
- All text is non-italic and uses `word-break: break-word`.

### Tracking
- **Letter-spacing in Figma output is in px.** It is always −3% of font-size, except:
  - footer: +10%
  - 40px agenda description: −1%
  - s7 body: −1%
  - s7 highlight description: −1%
  - s8 subtitle 64px: −2%
  - s10 subtitle 48px: −1.5%
  - s7 title: −4%
  - s9 product description: 0
- Prefer the px values below verbatim.

### Type scale observed
| Role | Family / weight | Size | Line-height | Tracking (px) | Used on |
|---|---|---|---|---|---|
| Closing display | Manrope 400 | 240 | 1.15 | −7.2 | s40 "Thank you" |
| Display / H1 | Manrope 500 (s1, s2, s3, s37, s39) or 600 (s8, s10, s26, s31) | 120 | 1.15 | −3.6 | cover, agenda title, section titles, CTA title |
| Ghost number L1 | Everett 400, white, opacity 0.2 | 120 | 1.15 | −3.6 | s3, s8, s37 |
| Agenda number | Everett 200, black, opacity 0.4 | 120 | 1.15 | −3.6 | s2 |
| Statement H1 | Manrope 600, #204680, centered | 90 | 1.15 | −3.6 | s7 |
| H2 | Manrope 600 (s9) / 500 (s2 item titles) | 72 | 1.15 | −2.16 | s9 "Pay. Move. Trade", agenda item titles |
| Section subtitle L1 | Manrope 400 | 64 | 1.15 (s3, s37) or 1.4 (s8) | −1.92 (s3, s37) or −1.28 (s8) | s3, s8, s37 |
| L2 eyebrow (number + parent label) | Everett 400 at 0.2 / Manrope 400 at 0.6 | 60 | 1.15 | −1.8 | s10, s26, s31 |
| Lead / subtitle 48 | Manrope 400 (s1 lh 1.15, s39 lh 1.4) / 500 (s9 lh 1.4) | 48 | see left | −1.44 | cover subtitle, s9 lede, s39 lede |
| L2 subtitle | Manrope 400 | 48 | 1.4 | −0.72 | s10, s26, s31 |
| Email (CTA) | Manrope 700, #EFA023 | 48 | 1.4 | −1.44 | s39 |
| Pillar header (s9) | Everett 300 number + Manrope 700 title | 40 | 1.15 | −1.2 | s9 |
| Highlight title | Manrope 600, white | 40 | 1.4 | −1.2 | s7 card |
| Agenda description | Manrope 500 | 40 | 1.4 | −0.4 | s2 |
| Contact label | Manrope 400, white | 36 | 1.15 | −1.08 | s39 |
| Body large | Manrope 600, black, centered | 32 | 1.6 | −0.32 | s7 body |
| Highlight description | Manrope 600, white | 28 | 1.2 | −0.28 | s7 card |
| Product name (s9) | Manrope 700 | 24 | 1.4 | −0.72 | s9 |
| Product description (s9) | Manrope 400 | 24 | 1.4 | 0 | s9 |
| Footer / caption | Manrope 400 | 24 | normal | **+2.4** | all |

---

## 7. Asset inventory (shared)
| File | Intrinsic | Bytes | Source node |
|---|---|---|---|
| `public/figma/shared/bg-dark.svg` | 1920×1080 | 5370 | BG `511:26153` |
| `public/figma/shared/logo-white.svg` | 299.41×71.0006 | 7317 | `I511:28907;738:2734` (s1) |
| `public/figma/shared/logo-white-sm.svg` | 220.725×52.3417 | 7365 | `I511:28922;738:2734` (s3; byte-identical on s8/10/26/31/37/39/40) |
| `public/figma/shared/logo-dark.svg` | 220.725×52.3417 | 7381 | `I511:28913;738:2734` (s2; byte-identical on s7/s9) |
| `public/figma/shared/accent-bar.svg` | 1920×11 | 395 | `511:26109` (cleaned export, see §4) |
