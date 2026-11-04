# UI audit: KYC - KYB → -> Expanded

*Generated 2026-11-04 by `scripts/ui-audit.ts` from `docs/ui-audits/raw/kyc-expanded-20638-28974.json` (captured 2026-11-04T14:30:00+08:00). Nothing is coded until this is accepted.*

- File `sm9kOVLwixDucqoX7etLI4`, node `20638:28974` · [open in Figma](https://www.figma.com/design/sm9kOVLwixDucqoX7etLI4/KYC---KYB?node-id=20638-28974) · 360×1681
- Subscribed libraries: [App] Component library V2, Foundation Library V2, [Web] Revamp Library V2

## Known (3 component instances) — reused, nothing to build

| Instance | Dekiru entry | Matched via | Variant properties |
|---|---|---|---|
| `Icon/Logo/Light` 22363:35965 | `coins-logo` (component) | main node 22361:39411 | Country=Philippines · Logo=On · Text=Off · Padding=Off |
| `Bottom` 20638:29174 | `bottom` (component) | main node 20587:26257 | Status=Default · Type=2_TextOnly · Keyboard=Off · Left icon=Off |
| `Top bar` 20638:29177 | `top-bar` (component) | main node 20587:32072 | Title=Off · Left=On · Right=Off |

## Patterns (3)

| Instance | Dekiru entry | Matched via | Variant properties on this screen |
|---|---|---|---|
| `Component 2` 21100:43867 | `verification-level-card` (pattern) | main node 21099:34179 | Style=Verify · Status=Active · Type=L1 · Expand=On · Device=H5 |
| `Component 3` 21100:43868 | `verification-level-card` (pattern) | main node 21099:34179 | Style=Verify · Status=Inactive · Type=L2 · Expand=On · Device=H5 |
| `Component 4` 21100:43869 | `verification-level-card` (pattern) | main node 21099:34179 | Style=Verify · Status=Inactive · Type=L3 · Expand=On · Device=H5 |

## Device chrome (1) — drawn by Dekiru, never mapped

| Instance | Dekiru entry | Matched via | Variant properties |
|---|---|---|---|
| `Status Bar 状态栏` 20638:29176 | `status-bar` (device) | main node 2:18171 | Dark=off · island=on |

## New (0) — would be built, once accepted

None.

## Unresolved (0) — instances the capture gave no identity for

None.

## Flags (4) — look at these in Figma

- **Default name.** Main component 21099:34179 is named `Component 2` / `Component 3` / `Component 4` (Figma's default); name it after what it is (Dekiru calls it `verification-level-card`).
- **Hidden alternatives.** `icon` (I21100:43867;21100:37098) holds 3 hidden layers beside the visible one: a variant chooser done by hand; should be an instance swap or a variant property.
- **Undecided sources.** `status-bar` is used here and still has 2 candidate source(s) beside the canonical one; pick on the library page.
- **Undecided sources.** `coins-logo` is used here and still has 2 candidate source(s) beside the canonical one; pick on the library page.

## Tokens — 0 new, 0 changed, 31 already held

