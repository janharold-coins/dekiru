# UI audit: KYC - KYB → Failed

*Generated 2026-11-04 by `scripts/ui-audit.ts` from `docs/ui-audits/raw/kyc-failed-21100-46618.json` (captured 2026-11-04T16:40:00+08:00). Nothing is coded until this is accepted.*

- File `sm9kOVLwixDucqoX7etLI4`, node `21100:46618` · [open in Figma](https://www.figma.com/design/sm9kOVLwixDucqoX7etLI4/KYC---KYB?node-id=21100-46618) · 360×800
- Subscribed libraries: [App] Component library V2, Foundation Library V2, [Web] Revamp Library V2

## Known (10 component instances) — reused, nothing to build

| Instance | Dekiru entry | Matched via | Variant properties |
|---|---|---|---|
| `Bottom` 21100:54150 | `bottom` (component) | Code Connect | — |
| `Top bar` 21100:46631 | `top-bar` (component) | Code Connect | — |
| `C-Tag/Rectangle` I21100:46624;21100:39093 | `tag` (component) | Code Connect (inside a pattern) | — |
| `1 Color` I21100:46624;21100:39168 | `icon` (component) | Code Connect (inside a pattern) | — |
| `1 Color` I21100:46625;21100:39182 | `icon` (component) | Code Connect (inside a pattern) | — |
| `C-Tag/Rectangle` I21100:46625;21100:39185 | `tag` (component) | Code Connect (inside a pattern) | — |
| `1 Color` I21100:46625;21100:39188 | `icon` (component) | Code Connect (inside a pattern) | — |
| `1 Color` I21100:46626;21100:39257 | `icon` (component) | Code Connect (inside a pattern) | — |
| `C-Tag/Rectangle` I21100:46626;21100:39260 | `tag` (component) | Code Connect (inside a pattern) | — |
| `1 Color` I21100:46626;21100:39263 | `icon` (component) | Code Connect (inside a pattern) | — |

## Patterns (1)

| Instance | Dekiru entry | Matched via | Variant properties on this screen |
|---|---|---|---|
| `Component 2` 21100:46624 | `verification-level-card` (pattern) | main node 21099:34179 | Style=Verify · Status=Failed · Type=L1 · Expand=Off · Device=H5 |

## Device chrome (1) — drawn by Dekiru, never mapped

| Instance | Dekiru entry | Matched via | Variant properties |
|---|---|---|---|
| `Status Bar` 21100:46630 | `status-bar` (device) | main node 20638:28683 | — |

## New (0) — would be built, once accepted

None.

## Unresolved (2) — instances the capture gave no identity for

- `Component 3` 21100:46625 (328×114) — probably the default-named set 21099:34179 (`verification-level-card`) under another default name; unverifiable without a per-instance id (REST API)
- `Component 4` 21100:46626 (328×116) — probably the default-named set 21099:34179 (`verification-level-card`) under another default name; unverifiable without a per-instance id (REST API)

## Flags (5) — look at these in Figma

- **Default name.** Main component 21099:34179 is named `Component 2` / `Component 3` / `Component 4` (Figma's default); name it after what it is (Dekiru calls it `verification-level-card`).
- **No variant properties.** `Status Bar` (main 20638:28683) is a plain component, likely file-local; if it is a reusable thing it should be a set in a library.
- **Undecided sources.** `status-bar` is used here and still has 2 candidate source(s) beside the canonical one; pick on the library page.
- **Undecided sources.** `tag` is used here and still has 1 candidate source(s) beside the canonical one; pick on the library page.
- **Text may overflow its box.** Node I21100:46624;21100:39095 hugs its content inside a fixed-width parent (76 chars: "Your address information has been rejected due to …"); if a line can't break it spills past the frame. Measure, shorten, or let the box size it.

## Tokens — 0 new, 0 changed, 27 already held

