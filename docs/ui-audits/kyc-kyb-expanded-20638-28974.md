# UI audit: KYC / KYB → "-> Expanded"

*2026-11-04 · first audit, done by hand through the Figma connector (the `ui:audit` tool will produce this report).*

- File: `KYC - KYB` (`sm9kOVLwixDucqoX7etLI4`), node `20638:28974`, frame "-> Expanded", 360 × 1681.
- Libraries the file subscribes to: **[App] Component library V2**, **Foundation Library V2**, [Web] Revamp Library V2.
- Screen: "Welcome to Coins.ph" verification levels (Basic / Identity / Enhanced), each an expandable card with requirements and unlocks; "Start verification" button and "Apply for corporate verification" link at the bottom.

## Known (already coded)

None. First screen.

## New (library instances → to be coded)

| Instance on the frame | Library component (set) | Library | Notes |
|---|---|---|---|
| `Status Bar 状态栏` | **Status Bar** (`07d7a4c9…`) | App V2 | Android status bar; Dekiru can draw this as frame chrome instead of coding it (as the spike did) |
| `Top bar` | **Nav bar/Top bar** (`e42f4ded…`) | App V2 | 360 × 48, appears empty on this screen |
| `Bottom` → `Button` × 2 | **Button** (`8bc60634…`, updated 2026-10-15) | App V2 | primary "Start verification", text link "Apply for corporate verification" |
| `Bottom` → `Bottom` (home indicator) | **Bottom Bar** (`1409a757…`) or a Foundation part | App V2 | frame chrome, like the status bar |
| `Bottom` → `Number Keyboard` (hidden) | — | App V2 | hidden on this screen; not coded |
| `C-Tag/Rectangle` (inside each card) | **Tag** (`b0aeebaa…`) | App V2 | "Level 1/2/3" chip |
| `1 Color` (×15: lock, check marks, chevron, row icons) | **1 Color** icon set (`36332540…`) | Foundation V2 | one `Icon` component with a `name` prop |
| `Icon/Logo/Light` | not found by search | ? | likely a Foundation logo asset; confirm |

## Patterns (repeated arrangements built from library components)

| Instances | Pattern | Composition |
|---|---|---|
| `Component 2`, `Component 3`, `Component 4` (the three level cards, 328 wide; file-local components with Figma's default names) | **Verification level card** → `src/ui/patterns/VerificationLevelCard` | **Library inside:** `Tag` (`C-Tag/Rectangle`, the "Level N" chip), `1 Color` icons ×8 (lock, chevron, row icons, check marks). **Hand-built:** title + description text, the divider `line`, the `Requirement:` rows (icon frame + text) and `Unlocks:` rows (label, optional amount, check), all plain frames → layout. **Flag:** the "Quick selfie check" icon slot holds four alternatives with three hidden, done by hand; should be an icon swap. In good standing otherwise: nothing inside redraws a library component. Promoting it to the App library later is a key rename, not a rebuild. |

Decision (Jan, 2026-11-04): treat as a pattern, not as a local component to promote first.

## Local / duplicate (fix in Figma, or accept)

| Finding | |
|---|---|
| `C-Tag/Rectangle` is a **[Web] Revamp Library V2** component (node `29:736` there), used on an app screen; the App library has its own `Tag` set (`b0aeebaa…`) | Found by Code Connect (2026-11-04). **Decision (Jan): one component regardless of library.** Dekiru's `Tag` carries both sets as its identity; the libraries should converge into one for app and H5. |
| `Status Bar 状态栏`'s library node `3823:46707` is in none of the three subscribed libraries; the App library has its own `Status Bar` set (`07d7a4c9…`) | Same rule: Dekiru's `StatusBar` carries the App set as an alias. The fourth library is still unnamed; Code Connect for it waits on that. |
| The App library itself has **two `Button` component sets** (`8bc60634…` 2026-10-15 and `b211b8a8…` 2025-11-23) plus a lowercase `button` (`172d80af…`) | Library hygiene: which one is current? The instances on this screen must be keyed to the one actually used (needs the per-instance key, see below). |

## Detached / hand-built (layout, not components)

Inside the level cards, these are plain frames, not instances, so they become layout in Dekiru, not code:

- requirement rows (`check` frame + text), unlock rows (`deposit` frame: label + amount, `check` frame with icon), the `list` / `need` / `unlock` groups, the divider `line`.
- `icon` slot in the "Quick selfie check" row holds four alternatives, three hidden: a variant chooser done by hand. Should be an icon swap on an instance.

Nothing on the screen looks like a detached library component.

## Tokens used (31 variables)

Colour: `Text/Primary (950)` #131b26 · `Text/Subtitle (700)` #5b6572 · `Text/Subtitle` #5b6572 (duplicate name) · `Text/Secondary (500)` #8795a8 · `Text/Inverse` #ffffff · `Core/Blue` #3385ff · `Core/Brand` #0e0f11 · `State/Success` #00bf30 · `Line/Strong` #e7e9ee · `Fill/Page (0)` #ffffff · `Fill/Float (25)` #ffffff · `Fixed/White` #ffffff · `Special/Tag/Grey Bg` #8997ab14 · `base/Grey/Grey 800` #454c56 · `base/Grey/Grey 950` #17191d

Type (all Cns Manrope): `Line 1.5x/H2 20px-700` · `Line 1.5x/Body 14px-500` · `Line 1.5x/Subtitle 14px-700` · `Line 1.5x/Subtitle 14px-600` · `Line Auto/H4 16px-600` · `Line Auto/Subtitle 14px-700` · `Web/Subtitle 16px-600` · `Web/body 14px-500` · `Web/Subtext 12px-500` · `Web/Subtext 10px-600` (+ the primitives they reference: font family, sizes 10/12, weights 500/600)

Effect: `Light- Shadow 1` drop shadow #0D1F4214 (0,1) blur 8

Observations: three naming families mixed on one app screen (`Line 1.5x/*`, `Line Auto/*`, `Web/*`); `Text/Subtitle` exists with and without the `(700)` suffix at the same value; three different white tokens. Worth a tidy in Foundation before Dekiru keys components to them.

## Instance identities and variant properties (from the Code Connect suggestion pass)

`get_code_connect_suggestions` on the frame returns, per instance, the **main component's node ID** and the **variant properties** set on the instance. That is the identity the plan needs (per-instance, not per-set), without the REST API, as long as the file is reachable through the connector.

| Instance | Main component (node) | Variant properties on this screen |
|---|---|---|
| `Icon/Logo/Light` 22363:35965 | 22361:39411 | Country=Philippines · Logo=On · Text=Off · Padding=Off |
| `Component 2` 21100:43867 (level card) | 21099:34179 | Style=Verify · Status=Active · **Type=L1** · Expand=On · Device=H5 |
| `1 Color` (lock) | 20074:18651 | Name=Locked · Form=Outline |
| `C-Tag/Rectangle` | 20286:21567 | Color=Grey · Type=S(10px) · Icon=Off |
| `Bottom` 20638:29174 | 20587:26257 | Status=Default · Type=2_TextOnly · Keyboard=Off · Left icon=Off |
| `Button` (inside Bottom) | 20531:26780 | Type=Primary · Size=L · Status=Default |
| `Status Bar 状态栏` 20638:29176 | 2:18171 | Dark=off · island=on |
| `Top bar` 20638:29177 | 20587:32072 | Title=Off · Left=On · Right=Off |

Two corrections to the sections above:

- The level card is **not a loose local component**: it is a proper **component set** with five variant axes (Style, Status, Type L1/L2/L3, Expand, Device H5). `Component 2/3/4` are the same set at Type=L1/L2/L3. As a Dekiru pattern it gets exactly those props. Only its *name* is the default one.
- `Bottom` is itself a library component set (Type=2_TextOnly etc.) that *contains* the two Buttons; the Button set in use is the one whose node is 20531:26780. Which of the three `Button` sets in the library that is still needs the set key (search gives keys per set; the suggestion pass gives node IDs), to be resolved when the audit tool joins the two.

## What the connector cannot give (affects the audit tool)

The Figma MCP connector returns node names, types and sizes, and the design-system search returns library component **set** keys, but it does not return the **main-component key of each instance** on a frame. The identity rule in the plan (match by key, never by name) therefore needs the Figma REST API (`GET /v1/files/:key/nodes?ids=…`, which returns `componentId` per instance and a `components` map with `key` and `remote`), i.e. a Figma personal access token in Dekiru's environment. Decision in the plan's step 4.

## Next

1. Jan decides on `Component 2/3/4` (promote to library vs. accept local) and on the duplicate `Button` sets.
2. Figma token for the REST API, so the audit tool can key instances exactly.
3. Then step 2 (tokens) and step 3 (components: Button, Tag, Icon, Top bar, the level card).
