# Pattern: product-hero (slides 11, 14, 17, 20, 23, 27, 32, 35)

Figma file `PhmKTV0Z0gwAKs8MNxEgcI`. All coordinates are slide px on the 1920×1080 frame. Content JSON: `specs/content/sNN.json`. Assets: `public/figma/sNN/hero.png` (2× scale).

Layout: a text column on the left (eyebrow, product name, tagline) and one large image on the right. Everything else is shared chrome (see `shared.md`).

## 1. Shared chrome on these slides

These are handled elsewhere and listed here only for reference.

- **Background:** the `light` gradient (#F0F0F0 → #EEF0EE).
- **Logo:** `Icon/Logo` at (79, 125), 222.45×52.34.
- **Footer:** "Strictly Private And Confidential" at (79, 938), 426×33.
  - Visible on 11, 14, 17, 23, 27, 32 and 35.
  - **Slide 20 does not show it.** In Figma the footer instance (`511:29744`) sits *below* the inner frame (`511:29745`), and that frame's opaque fill covers it. Decide with the chrome owner whether to render it on s20. The design render has no footer.
- **Accent bar:** (0, 1069), 1920×11. It is the top layer on every slide and covers any visual that reaches the bottom edge.
- **Hidden layers to ignore:** the hidden `01B2` instance (s11, s20, s23, s27), and the hidden third text layer inside each text column's `Frame 27`. On most slides it reads "Online. In-store. In crypto. One integration."; on s14 it is a description paragraph.

## 2. Text column (identical on all 8 slides)

Structure (Figma auto-layout, vertical, left-aligned):

```
Frame 40  (x 79, width 751)
└─ Frame 39  column, gap 11px, width 733px (751px on s11 & s17)
   ├─ eyebrow
   └─ Frame 27  column, gap 8px
      ├─ title
      └─ tagline
```

| Role | Font | Size | Line-height | Letter-spacing | Color | Line box |
|---|---|---|---|---|---|---|
| eyebrow ("Products and Pricing") | Manrope Bold 700 (Figma family "Cns Manrope") | 28px | 1.15 (32.2px) | −0.84px (−0.03em) | `#545454` | 32 |
| title (product name) | Manrope Bold 700 | 60px | 1.15 (69px) | −1.8px (−0.03em) | `#000000` | 69 |
| tagline | Manrope Regular 400 | 40px | 1.4 (56px) | −1.2px (−0.03em) | `#000000` | 56 per line |

- **Width:** 733px. Slides 11 and 17 use 751px, which makes no visible difference because no line wraps at either width. Use `max-width: 751px`.
- **Line breaks:** the tagline wraps only at explicit breaks (`\n` in the JSON; render with `white-space: pre-line` or `<br>`). Two-line taglines: s14, s17, s32. All others are one line.
  - Figma has a trailing space before each break ("Accept fiat and crypto. ⏎"). It was trimmed in the JSON and is invisible either way.
- **Block height:**
  - 1-line tagline: 32 + 11 + 69 + 8 + 56 = **176**
  - 2-line tagline: 32 + 11 + 69 + 8 + 112 = **232**
- **Vertical position:** the block is **vertically centered on y = 540** on every slide.
  - 1-line tagline: top at y 452 (452.5 on s11)
  - 2-line tagline: top at y 424 / 424.5
  - Implement as `top: 50%; transform: translateY(-50%)` or flex-center with `left: 79px`. Do not hard-code the top. The 0.5px differences are Figma rounding.
- **Measured glyph right edges (1×):**

  | Slide | 11 | 14 | 20 | 23 | 27 | 32 | 35 |
  |---|---|---|---|---|---|---|---|
  | Right edge | 762.5 | 542.5 | 759 | 658.5 | 733 | 635 | 568.5 |

  No text overlaps any visual.

## 3. Image slot: one PNG per slide

`hero.png` is a 2× render of the slide cropped to the visual's bounding box. Place it at `imageSlot` (x, y, w, h). The image's pixel size is exactly 2·w × 2·h, so render it at w×h with no scaling or cropping.

**Why the PNGs are not plain node exports.** Figma's MCP export flattens every node onto a backdrop. Nested nodes got the slide background; slide-level children got the #1E1E1E canvas. No transparent per-node export was possible, and the visuals are 2–4 overlapping groups. So each hero was cut from the full-slide 2× render:

- **Inside the mockup rectangles, including their drop-shadow margins:** the pixels are opaque, and the light-gradient background is baked in at its true position. It matches the slide background (pixel range 236–241) without a seam.
- **Outside those rectangles:** alpha is 0. This matters on s20, where the L-shaped composite leaves the text area fully transparent. It also applies to small corners on 14, 23, 27 and 32.

Consequences:

- The hero must sit on the `light` background.
- Put it **below** the text column and the chrome in z-order (bg < hero < text/logo/footer < accent bar).

### Slot geometry

| Slide | Product | Figma visual nodes (bottom→top) | x | y | w | h | Right edge | Bottom edge | PNG px |
|---|---|---|---|---|---|---|---|---|---|
| 11 | QRPh and WebPay | `511:29493` QR card, `511:29510` phones, `511:29530` payment toasts (overlap: phones over card, toasts over phones) | 837 | 69 | 1027 | 1000 | 1864 (inside) | 1069 (bleeds under accent) | 2054×2000 |
| 14 | Virtual Accounts | `511:29681`, `511:29682`, `511:29683` (3 overlapping browser shots) | 614 | 33 | 1306 | 1036 | 1920 (bleeds right) | 1069 (bleeds) | 2612×2072 |
| 17 | QRPh Scan and Pay | `511:29734` photo (1380×1080 at x 711, cropped by slide to 1209 wide) | 711 | 0 | 1209 | 1080 | 1920 (bleeds) | 1080 (full height, under accent) | 2418×2160 |
| 20 | Business Portal | `511:29748`, `511:29749`, `511:29757` modal, `511:29758` (overlapping) | 431 | 0 | 1489 | 1069 | 1920 (bleeds) | 1069 (bleeds) | 2978×2138 |
| 23 | Disbursement | `511:29777`, `511:29778`, `511:29779`, `511:29780` (overlapping) | 699 | 24 | 1221 | 1045 | 1920 (bleeds) | 1069 (bleeds) | 2442×2090 |
| 27 | Multi-Currency | `511:29802` (portal + dim overlay + modal), `511:30334` (Buy/Sell + Confirm cards on top) | 794 | 97 | 1126 | 972 | 1920 (bleeds) | 1069 (bleeds) | 2252×1944 |
| 32 | OTC RFQ | `511:30420` portal, `511:30670` Convert Box (on top) | 658 | 98 | 1262 | 950 | 1920 (bleeds) | 1048 (floats) | 2524×1900 |
| 35 | Order Book | `511:30723` single exchange screen | 646 | 89 | 1274 | 927 | 1920 (bleeds) | 1016 (floats) | 2548×1854 |

Notes:

- **Slot extent:** each slot covers the visible pixels plus the drop shadows (about 12–25px around each card).
- **Mockups reaching the bottom:** they are cut at **y 1069**. In Figma they run under the accent bar, so nothing visible is lost.
- **Slide 17 photo:**
  - Not rounded.
  - The node continues 171px past the right edge, and the PNG is the visible crop.
  - It runs to 1080 under the accent bar.
- **Original Figma bounds, which extend beyond the slide and are clipped:**
  - s11 phones frame (537, −21, 1810×1124)
  - s14 `511:29683` (626, 556, 1134×847)
  - s20 RBAC (444, 674, 983×1505)
  - s23 `511:29778` (1439, 215, 460×1025)
  - s27 (806, 412, 1134×737)
  - s32 (812, 108, 1536×868)
  - s35 (646, 89, 1344×926)

## 4. Recommendation: image-slot variants

Two variants are enough. The geometry is data-driven, because no two mockup slots share a rect.

1. **`mockup`**: an absolutely positioned `<img>` at `imageSlot` {x, y, w, h}, rendered at exactly w×h (`object-fit: fill`, i.e. natural size).
   - Slides 11, 14, 20, 23, 27, 32, 35.
   - The slide root needs `overflow: hidden`, since slots touch x = 1920 and y = 1069.
   - Sub-cases for QA only; they need no separate code:
     - **right + bottom bleed:** 14, 20, 23, 27
     - **right bleed, vertically floating:** 32 (y 98–1048), 35 (y 89–1016)
     - **contained horizontally, bottom bleed:** 11 (x 837–1864)
2. **`photo`**: full-height right block.
   - Slide 17 only.
   - `left: 711px; top: 0; width: 1209px; height: 1080px; object-fit: cover`.
   - No radius.
   - Sits under the accent bar.
   - If the photo is ever swapped, keep the slot and let `object-fit: cover` crop (the Figma source crop is anchored left/center).

The text column is the same component on all eight slides (§2): left 79, vertically centered at 540. Only the tagline's line count changes its top. The image never overlaps the rendered text. The closest gap is s20, where the slot starts at x 431 but is transparent above y 662.
