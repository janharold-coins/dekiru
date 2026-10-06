# Product patterns — `product-detail` and `product-flow`

Source: Figma `PhmKTV0Z0gwAKs8MNxEgcI`. Every slide is a 1920×1080 frame. All coordinates below are in **slide px** (origin top-left of the frame).
Reference code (verbatim get_design_context output): `specs/raw/s12.tsx`, `specs/raw/s36.tsx`, `specs/raw/s13.tsx`.
Content: `specs/content/sNN.json` (one per slide, 15 files).

| Pattern | Slides (node) |
|---|---|
| product-detail | 12 `511:29617`, 15 `511:29686`, 18 `511:29737`, 21 `511:29760`, 24 `511:29782`, 28 `511:30382`, 33 `511:30672`, 36 `511:31567` (VIP-tier variant) |
| product-flow | 13 `511:29652`, 16 `511:29721`, 19 `511:29740`, 22 `511:29762`, 25 `511:29784`, 29 `511:30384`, 34 `511:30709` |

Slides 18, 21, 24, 28 (detail) and 16, 19, 22, 25, 29, 34 (flow) are instance-only frames. Their layers were read from inside the instance; geometry and type are identical to the non-instance slides.

---

## 0. Shared chrome (handled by the chrome agent, listed here for reference only)

- **Background**: `linear-gradient(139.0856deg, #F0F0F0 30.321%, #EEF0EE 87.755%)` on the full frame.
- **Logo** (`Icon/Logo`): x 79, y 125, 222.45 × 52.34.
- **"Strictly Private And Confidential"**: 426 × 33.
  - Detail slides 12, 15, 18, 21, 24, 28 and 36: top-right at **x 1417, y 74**.
  - Detail slide **33** and **all flow slides**: bottom-left at **x 79, y 938**.
- **Accent bar**: x 0, y 1069, 1920 × 11.

## 1. Fonts, colours and assets

Fonts:
- `Cns Manrope`: Regular 400, Medium 500, SemiBold 600, Bold 700.
- `TWK Everett`: Regular, Medium, Bold. Used only for numbers (price values, tier values, step numbers) and for a few inconsistent text lines, noted where they occur.

Colours (all are CSS values):

| Token suggestion | Value | Use |
|---|---|---|
| text | `#000000` | body, titles, labels |
| eyebrow-detail | `#545454` | "Products and Pricing" on detail slides |
| eyebrow-flow / step-caption | `#757575` | eyebrow on flow slides, step captions |
| description | `#606060` | detail description (slide 36 uses `#777777`) |
| pricing-subtext | `#898989` | second line of a text pricing block |
| chip-border | `#BCBCBC` | price chips and VIP tiers (2px) |
| step-number | `#EFA023` | 01–05 on the step cards |
| chevron | `#0095FF` | arrows between steps |
| dash | `rgba(0,0,0,0.2)` | short line after the "What it is" and "Key APIs" labels |

Assets, saved in `public/figma/shared-product/` and checked to be non-empty:
- `section-dash-line.svg` (259 B): 48 × 4 viewBox, a horizontal line at y=2, `stroke="black" stroke-width="4" opacity="0.2"`. Slides 12 and 36 serve byte-identical copies. It is used after "What it is" and "Key APIs".
- `flow-chevron-arrow.svg` (333 B): 30.6034 × 52.0001 viewBox, path `M8 2L28 26L8 50`, `stroke="#0095FF" stroke-width="4" stroke-linecap="round"`. It is used between step cards.

**Borders.** All Figma strokes are **inside** strokes. The measured boxes below already include the border. When you build a box in CSS with `box-sizing: border-box`, keep the padding at the Figma value and do not let the border change the outer size. For hug-sized boxes, use `padding = figmaPadding − borderWidth`, or draw the border as an inset `box-shadow`, so the hug size matches Figma (for example, a chip is 138 tall, not 142).

---

## 2. Pattern A: `product-detail`

### 2.1 Default layout (slides 12, 15, 18, 24, 28, 33; slide 21 = no Key APIs card)

```
x79,y229 ┌ LEFT COLUMN (w751, flex-col, gap 80) ───────┐   x903,y336 ┌ RIGHT ROW (w940, flex-row, gap 60, align-start) ┐
         │ HEAD (w733, flex-col, gap 11)               │            │ WHAT col (w420)  │ KEY APIs card (w460)          │
         │   eyebrow                                   │            └──────────────────┴──────────────────────────────┘
         │   TITLE GROUP (flex-col, gap 8)             │
         │     title / tagline / description           │                         PRICING ROW: right 77, bottom 92
         │ WHO (w751, flex-col, gap 8)                 │                         (right edge x1843, bottom edge y988)
         │   whoLabel / who                            │
         └─────────────────────────────────────────────┘
```

#### Left column: absolute at left 79, top 229, width 751, flex column, gap 80px

| Element | Font | Size / line-height | Letter-spacing | Colour | Box |
|---|---|---|---|---|---|
| HEAD wrapper | — | — | — | — | w 733, flex-col, gap **11** (eyebrow → title group) |
| eyebrow "Products and Pricing" | Manrope Bold | 28 / 1.15 (32.2px) | −0.84px (−0.03em) | `#545454` | w 733, h 32 |
| TITLE GROUP | — | — | — | — | flex-col, gap **8** |
| title | Manrope Bold | 60 / 1.15 (69px) | −1.8px (−0.03em) | `#000` | w 733, h 69 |
| tagline | Manrope Regular | 40 / 1.4 (56px) | −1.2px (−0.03em) | `#000` | w 733, 56/line |
| description | **Manrope Medium** | 28 / 1.4 (39.2px) | −0.42px (−0.015em) | `#606060` | w 733, 39.2/line |
| WHO wrapper | — | — | — | — | w 751, flex-col, gap **8** |
| whoLabel "Who is it for" | Manrope Bold | 36 / 1.4 (50.4px) | −1.08px (−0.03em) | `#000` | h 50 |
| who | Manrope Regular | 40 / 1.6 (64px) | −1.2px | `#000` | w 751, 64/line |

The WHO block flows directly below HEAD (+80). On slide 12, HEAD is 223 tall, so WHO starts at y 532. With the longest content (slide 15: a 2-line tagline, a 3-line description and a 4-line who), the column ends at about y 980.

#### Right row: absolute at left 903, top 336, width 940, flex row, gap 60, align-items flex-start

**WHAT column** (no border, no background): w 420, flex-col, gap 24, padding 36px 0 (vertical only).
- **Section header** (also used in the Key APIs card): flex row, gap 36, align center, padding-left 24, height 50.
  - Label: Manrope Bold 36 / 1.4, letter-spacing −1.08px, `#000`, nowrap. "What it is" is 154 wide; "Key APIs" is 140 wide.
  - Dash: `section-dash-line.svg` in a 48 × 4 box, vertically centred on the label. Figma puts the stroke centre 2px above the row centre (the line node is h0 at y25, and the img spans y21–25). Plain `align-items:center` is close enough.
- **Bullet list** (`ul`, `list-style: disc`, marker outside): Manrope Regular 24px, **line-height 1.6 (38.4px)**, letter-spacing −0.72px (−0.03em), `#000`, w 420.
  - Each `li`: `margin-inline-start: 36px`, `margin-bottom: 12px` (none on the last item).
  - The text column is 420 − 36 = 384px wide.

**KEY APIs card**: w 460, **border 1px solid #000** (inside), **border-radius 12px**, padding 36px 24px, flex-col, gap 24, transparent background.
- The header is the same as above. Because of the card's 24px padding plus the header's 24px padding-left, the label starts at x +48 inside the card.
- The bullet list is the same as above and fills the card width (412). Text column: 412 − 36 = 376.
- Slide 12 measures 460 × 410 (4 bullets); slide 15 measures 460 × 322 (3 bullets). The WHAT column is 420 × 436 on slide 12 (3 bullets, 7 lines) and 420 × 474 on slide 15 (8 lines).

Slide 21 has no Key APIs card. The WHAT column stays at x 903 and nothing is placed in the right half.

#### Pricing row: absolute, right 77, bottom 92 → right edge x 1843, bottom edge y 988

Flex row, gap **36**, align-items center, justify flex-end, white-space nowrap.

1. **pricingLabel** "PRICING": Manrope Bold 36 / 1.4 (50.4px), letter-spacing **+1.08px (+0.03em)**, `#000`.
2. **Chips group** (kinds `chips` and `chips+text`): flex row, gap **24**, align center.
3. **Text block** (kinds `text` and `chips+text`): flex-col, gap **4**, align flex-start.
   - text: 24 / 1.4 (33.6px), letter-spacing −0.72px, `#000`.
   - subtext: 20 / 1.4 (28px), letter-spacing −0.6px, `#898989`.
   - The font family is not consistent in Figma. Recommended canonical: **Manrope Medium** for both lines, which matches slides 28 and 33 and the slide 24 subtext. Per-slide values found in Figma:
     - s15: Manrope Regular / Regular.
     - s18 and s21: TWK Everett Regular / Regular.
     - s24: Manrope SemiBold (text) / Manrope Medium (subtext).
     - s28: Manrope Medium / Medium.
     - s33: Manrope Medium, text only, no subtext.

In `chips+text` (slide 24), the order is: label, chips, then text. The 36 gap applies between all three.

**Price chip** (component instance; `I…;407:13285` is the label, `…;407:13290` is the value row)
- Background `#FFFFFF`, **border 2px solid #BCBCBC** (inside), **border-radius 8px**, padding 24, flex-col, align-items center, text-align center.
- Size: **height 138** (hug). Width hugs the content: QRPh 124, WebPay 134, Crypto spread 197, InstaPay 139, PESONet 144.
  - 138 = 24 + 33.6 (label) + 56 (value row) + 24, with the border inside.
- label: Manrope Regular 24 / 1.4, letter-spacing −0.72px, `#000`.
- value row: flex row, align-items **center**, justify center, font **TWK Everett Bold**, line-height 1.4.
  - value: 40px, no letter-spacing (56px line).
  - unit: 20px, letter-spacing −0.6px (28px line), vertically centred against the value. Units seen: `%` and `PHP`.
- The chip has no separate caption line. The only text besides the value is the top **label**. In the JSON, `chips[].caption` is always `null` and the top text is `chips[].label`.

**Slide 12 measured positions.** The row is at x 1151, y 850, 692 × 138. PRICING is at row x 0 (153 wide, centred). The chips start at row x 189 (153 + 36), at 0 / 148 / 306 (24 gaps).
**Slide 15 (text kind).** The row is at x 1195, y 922, 648 × 66. The text block is 459 × 66 (34 + 4 + 28).
**Slide 24 (chips+text).** The row is at x 1032, y 850, 811 × 138. The chips group is at row x 189 (chips at 0 and 163). The text block is at row x 532 (189 + 307 + 36), 279 × 66, vertically centred.

### 2.2 Variant: Order Book with VIP tiers (slide 36, `511:31567`)

The whole layout changes. Positions are absolute:

| Block | Position | Notes |
|---|---|---|
| HEAD (eyebrow, title, tagline, description) | left 79, **top 305**, w 733 | No gap-80 column; WHO is placed elsewhere. |
| eyebrow | **TWK Everett Bold** 28 / 1.15, −0.84px, `#545454` | Differs from the default (Manrope Bold), probably a Figma slip. Recommend Manrope Bold for consistency. |
| description | **Manrope Regular** 28 / 1.4, −0.42px, **`#777777`** | Differs from the default (Medium, `#606060`). |
| WHO block | **left 717, top 321**, w 751, flex-col gap 8 | Same type as default. Body is 3 lines (192 tall); the block ends at y 571. |
| WHAT column | **left 1458, top 285**, w 420 | Same component, but the list **line-height is 1.5 (36px)**, not 1.6. Its right edge is x 1878, past the usual 1843 margin. |
| Key APIs | — | Not shown. It is hidden in Figma with placeholder copy; ignore it. |
| VIP PRICING block | **left 79, top 735**, 1530 × 242 (equivalently right 311, bottom 103) | flex-col, gap **12**, align-items flex-start |

- VIP PRICING label: Manrope Bold 36 / 1.4, **+1.08px**, `#000`, text "VIP PRICING" (220 × 50).
- **Tier row**: flex row, gap **48**, align-items flex-start, height 180. Tier x positions: 0, 314, 608, 934, 1254. Widths hug content: 266, 246, 278, 272, 276.

**VIP tier chip** (outer frame `410:14983` with an inner frame `410:14968`)
- The outer wrapper has border-radius 8px and carries the **background gradient**. The inner box has **border 2px solid #BCBCBC** (inside), radius 8, padding 24, flex-col, align-items flex-start, nowrap.
- Size: hug width (246–278 seen), **height 180**.
- Rows, stacked with no gap:
  1. **Header row**: flex, `justify-content: space-between`, width 100%, 16 / 1.4 (22.4px). Left "VIP" is Manrope SemiBold; right "LEVEL N" is Manrope Bold.
  2. **Value row**: flex, align center. Font TWK Everett Bold, line-height 1.4. Value is 40px; unit `%` is 20px with −0.6px letter-spacing.
  3. **Condition paragraph**: letter-spacing −0.72px. It has two lines with an explicit break:
     - Line 1, 24 / 1.4: `conditionPrefix` in Manrope SemiBold, then `conditionAmount` in **Manrope Bold**.
     - Line 2, 16 / 1.4: "30-day transaction volume" in Manrope Medium.
     - The paragraph box is about 53.6 tall, so 24 + 22.4 + 56 + 53.6 + 24 ≈ 180.
  - Figma's bold split is inconsistent: L5, L7 and L9 bold only "M PHP" / "B PHP", while L0 and L3 bold "5M PHP". The JSON gives the normalised split in `conditionPrefix`/`conditionAmount` and the raw Figma split in `figmaBoldSplit`. Recommend bolding the whole amount.
- **Text colour**: `#000` on tiers 0–7. The highlighted tier uses **`#FFFFFF`** for all text. The border stays `#BCBCBC`.
- **Backgrounds**, from left to right. Each tier gets more orange; the last one is the highlight:

| Tier | CSS background (outer wrapper) | Render check (corner TL → centre → BR) |
|---|---|---|
| L0 | `linear-gradient(159.72deg, #FFFFFF 17.66%, #EDEDED 96.685%)` | #fff → #f6f6f6 → #ececec ✓ |
| L3 | `linear-gradient(158.22deg, #FFFFFF 17.66%, #FFF2E8 96.685%)` | #fefefe → #fef8f4 → #fef2e8 ✓ |
| L5 | `linear-gradient(158.59deg, #FFFFFF 47.038%, #FDBF92 105.38%)` | #fefefe → #fcfaf8 → #fcc7a1 ✓ |
| L7 | `linear-gradient(148.58deg, #FFFFFF 15.354%, #FCA668 92.801%)` | #fefefe → #fcd5ba → #fca668 ✓ |
| **L9 (highlight)** | **`linear-gradient(146deg, #FCBC8F 0%, #FA7312 95%)`** | #fbba8c → #fb944b → #fa7312 |

  The MCP-generated L9 gradient (`#FFF 78.197% → #FA7312 91.96%`) does **not** match the render: the real chip is orange across its whole surface. The L9 value in the table above was fitted from pixels sampled along the diagonal. Use the table value.
- Generalising to N tiers: by default, `highlight: true` goes on the last tier only. The non-highlight tiers interpolate from neutral grey (first) towards orange (just before the highlight).

---

## 3. Pattern B: `product-flow` (slides 13, 16, 19, 22, 25, 29, 34)

| Element | Position | Font | Size / LH | Letter-spacing | Colour |
|---|---|---|---|---|---|
| eyebrow "Products and Pricing" | top **239**, left 819 (w 266, so its centre is x 952, 8px left of the slide centre; centre it in code) | Manrope Bold | 28 / 1.15 | −0.84px | **`#757575`** |
| title row | top **282**, horizontally centred (`left:50%; translateX(-50%)`), h 67 | 48 / 1.4 (67.2px) | −1.44px (−0.03em) | `#000` | flex row, **gap 24**, align flex-start, nowrap |
| titleBold | in title row | Manrope **Bold** | 48 | | |
| titleRegular "Product Flow" | in title row | Manrope **Regular** | 48 | | |

On slide 13 the title row is x 612–1308 (696 wide): the bold part is 401, then the 24 gap, then "Product Flow" at 271.

**Steps row**: top **422**, full width (1920, centred), flex row, **gap 16**, align-items center, justify center, height 272.
- Sequence: card, gap 16, chevron, gap 16, card, and so on. That makes 5 cards and 4 chevrons.
- Total width: 5·300 + 4·28 + 8·16 = **1740**, so the row runs from x **90 to 1830**.
- Card x positions: 90, 450, 810, 1170, 1530. Chevron x positions: 406, 766, 1126, 1486, each at y offset 112 (vertically centred).
- Every card wrapper uses `align-self: stretch`, so **all cards share the height of the tallest one (272)**.

**Step card** (component, inner ids `…;409:13452` title, `…;409:13453` caption, `…;409:13454` number)
- Size: width **300**, height **272** (stretched). Border **1px solid #000** (inside, confirmed pure black in the 1:1 render). **Border-radius 8px.**
- Background: `linear-gradient(138.75deg, #FFFFFF 50%, #FBFBFB 94.311%)`.
- Padding **60 / 30 / 30 / 30** (top / right / bottom / left). Flex-col, **gap 36**, align flex-start. Content width is 240.
- **number** ("01"–"05"): position absolute, **right edge at x 281** inside the card (`right: 19px` from the outer edge), **top 7**. TWK Everett **Medium** 24 / 1.4, letter-spacing −0.24px (−0.01em), `#EFA023`, right-aligned, nowrap.
- **title**: Manrope **Medium** 32 / 1.4 (44.8px), letter-spacing −0.8px (−0.025em), `#000`.
  - **The last step (05) is Manrope Bold.** All 7 slides do this.
  - Two lines are designed in: give the title a `min-height` of 89.6px so captions line up. Slide 34 step 05 ("You settle it") pads a second line in Figma with a zero-width space.
- **caption**: Manrope Medium 20 / 1.4 (28px), letter-spacing −0.2px (−0.01em), `#757575`. Up to 2 lines (56px).
- Height check: 60 + 89.6 + 36 + 56 + 30 = 271.6, which rounds to 272.

**Chevron arrow**: a 28 × 48 box. The SVG (`flow-chevron-arrow.svg`, 30.6 × 52 intrinsic) sits inside it at `inset: -4.17% -9.3% -4.17% 0`, which is top −2, bottom −2, right −2.6, left 0, with overflow visible. Keep the SVG's own width and height and do not stretch it.

---

## 4. Text handling rules for the JSON content

- A `\n` in any string is an **explicit line break in Figma** (a `<br>` or a separate paragraph). Every other wrap is a soft wrap at the box width.
- Spaces at the end of a line before a break were stripped, because they are invisible Figma artifacts. Spaces inside a line are kept exactly, including the double space in s13 step 5: "account,  T+0 Settlement."
- Kept as in Figma (copy errors carried into the deck): s18 "1 time KYC,, no app switch." (double comma); s18 pricing "1 to 5 PHP per successful transactions"; s24 bullet 3 has no final period ("…Either way, same-day"); s29 flow title is "Multi-currency" while s28's detail title is "Multi-Currency". Apostrophes are straight (`'`) as in Figma.
- `pricing.kind` values in use:
  - `chips` (s12)
  - `text` (s15, s18, s21, s28, s33)
  - `chips+text` (**s24**: two chips, then a text block; a new kind not in the original schema)
  - `tiers` (s36)
  - Text pricing has `text` (line 1) and `subtext` (grey line 2, may be `null`).
- `texts.keyApisLabel` is `null` and `keyApis` is `[]` when the card is absent (s21, s36). `texts.pricingLabel` is "PRICING", or "VIP PRICING" on s36.

---

## 5. Character budgets (observed in the real slides), for overflow warnings

Character counts exclude `\n`. "Rendered lines" is what Figma actually shows at the box width.

### product-detail (8 slides)

| Slot | Box width / font | Max chars (slide) | Min | Max rendered lines | Suggested warn at |
|---|---|---|---|---|---|
| eyebrow | 733 / 28 Bold | 20 (all) | 20 | 1 | 40 |
| title | 733 / 60 Bold | 17 (s18 "QRPh Scan and Pay") | 7 | 1 | 22 (≈ 1 line) |
| tagline | 733 / 40 Reg | 49 (s15, 2 explicit lines) | 30 | 2 | 55, or more than 2 lines |
| description | 733 / 28 Med | 148 (s15) | 45 | 3 | 150, or more than 3 lines (≈ 50 chars per line) |
| who | 751 / 40 Reg, LH 64 | 156 (s15) | 94 | 4 | 160, or more than 4 lines (≈ 38–40 chars per line) |
| what bullet (each) | 384 / 24 Reg | 83 (s15 #1) | 38 | 3 | 85, or more than 3 lines (≈ 32 chars per line) |
| what bullets (total) | — | 225 (s15) | 139 | — | 230 |
| what bullet count | — | 3 on every slide | 3 | — | more than 3 |
| key-API bullet (each) | 376 / 24 Reg | 45 (s12 #1) | 20 | 2 | 50, or more than 2 lines (≈ 31 chars per line) |
| key-API bullets (total) | — | 129 (s12) | 95 | — | 135 |
| key-API bullet count | — | 4 (s12); otherwise 3; 0 on s21 and s36 | 0 | — | more than 4 |
| chip label | hug / 24 Reg | 13 (s12 "Crypto spread") | 4 | 1 | 16 |
| chip value | hug / 40 Everett Bold | 5 (s12 "< 1.0") | 1 | 1 | 7 |
| chip unit | — | 3 ("PHP") | 1 | 1 | 4 |
| chip count | — | 3 (s12), 2 (s24) | — | — | more than 3 (more than 2 with a text block) |
| pricing text | nowrap / 24 | 45 (s15) | 22 | 1 | 48 |
| pricing subtext | nowrap / 20 | 69 (s18) | 27 | 1 | 72 |
| tier value | hug / 40 Everett Bold | 9 ("0.10-0.15") | 9 | 1 | 10 |
| tier condition line | hug / 24 | 19 ("w/ less than 5M PHP") | 11 | 1 | 22 |
| tier count | — | 5 (s36) | — | — | more than 5 (the row is 1530 wide at gap 48) |

### product-flow (7 slides)

| Slot | Box width / font | Max chars (slide) | Min | Max rendered lines | Suggested warn at |
|---|---|---|---|---|---|
| titleBold | nowrap / 48 Bold | 17 (s19 "QRPh Scan and Pay") | 7 | 1 | 24 (the title row must fit inside about 1760) |
| step title | 240 / 32 Med | 28 (s13 #1 "Your customer is ready to buy") | 13 | 2 | 28, or more than 2 lines (≈ 14 chars per line) |
| step caption | 240 / 20 Med | 50 (s13 #5) | 24 | 2 | 50, or more than 2 lines (≈ 24 chars per line) |
| step count | — | 5 on every slide | 5 | — | not equal to 5 (the row is 1740 wide) |
