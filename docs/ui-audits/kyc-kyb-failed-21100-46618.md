# UI audit: KYC / KYB → "Failed"

*2026-11-04 · second screen; the reuse test. Done through the Figma connector by hand; Code Connect from the first screen now does part of the audit for us: `get_design_context` returns Dekiru's own `Tag`, `Icon`, `Button`, `Bottom` and `TopBar` for the instances it recognises, and `get_code_connect_suggestions` lists only what is still unmapped.*

- File: `KYC - KYB` (`sm9kOVLwixDucqoX7etLI4`), node `21100:46618`, frame "Failed", 360 × 800.
- Screen: "Account verification" with the three level cards collapsed; Level 1 in its Failed state (red icon, rejection reason); "Verify now" + "Check account limits" footer; back chevron in the top bar.

## Known (reused, nothing built)

| Instance | Dekiru entry | Source hit |
|---|---|---|
| `Top bar` | `top-bar` | App V2 (mapped) |
| `Bottom` → `Button` ×2 | `bottom`, `button` | App V2 (mapped) |
| `C-Tag/Rectangle` ×3 | `tag` | Web Revamp V2 (canonical source; mapped) |
| `1 Color` ×5 (lock ×2, chevron ×3) | `icon` | Foundation V2 (mapped) |
| `Component 2/3/4` | `verification-level-card` (pattern) | file-local set `21099:34179`, same as screen 1 |
| home indicator | `home-indicator` (device) | inside `Bottom` |

## New (variants of known things; nothing new as a component)

| What | Where it went |
|---|---|
| Level card **Status=Failed**: red `Failed` (Solid) icon in place of the lock, description in `Core/Red` at `Line 1.5x/Body 12px-500`, grey border with the shadow | `VerificationLevelCard` `status: "Failed"` |
| Level card **Expand=Off**: header only, no divider or lists | `VerificationLevelCard` `expanded: false` |
| Top bar **Left=On** with a visible 24px `Left` icon (on screen 1 the slot was empty) | `TopBar` draws `Icon Left` when `left` |
| Icons `Left`, `Failed` (library names) | `Icon` |
| Tokens `Core/Red`, `System/White`, `Fill/Control (75)`, `Line 1.5x/Body 12px-500` | `tokens.json` (35 now) |

## Patterns: how the variants were identified

The instance's **variant properties** name them: `Status=Failed · Expand=Off · Type=L1` on card 1, and the pattern's axes were already known from screen 1 (Style × Status × Type × Expand × Device). So a new variant is a new *value* on a known axis, and the pattern gets a prop value, not a new component. What the value *looks like* comes from the instance's styles (icon swap, red text, no body). Values seen so far: Status ∈ {Active, Inactive, Failed}; Expand ∈ {On, Off}; Type ∈ {L1, L2, L3}; Style = Verify; Device = H5. Unseen values stay unimplemented until a screen shows them.

## Local / duplicate / overrides (fix in Figma, or accept)

| Finding | |
|---|---|
| **"Check account limits" is a hand override.** The instance is the footer's Text-only button (same node path as screen 1's link) with `Fill/Control (75)` painted on it. The design context still reports it as `Button type="Text-only"`. | Dekiru draws it as `Button type="Secondary"` (`Bottom secondaryType`). In Figma it should be a Button variant, not an override. |
| **A third status bar.** `Status Bar` main node `20638:28683`: 44px, "9:55", Urbanist; no variant properties, not mapped anywhere (file-local). Screen 1's was 56px from an unknown library; the App library has its own. | `status-bar` (device) takes `height: 44 \| 56`; the node is a third candidate source. Device chrome, so no mapping needed. |
| Card 1's icon slot wraps the icon in an extra `icon` frame (24px) rather than placing the `1 Color` instance directly, unlike cards 2 and 3. | Cosmetic in Figma; no effect in Dekiru. |

## Detached / hand-built

None beyond the override above.

## Tokens used

27 variables; 4 new (listed above). Screen 1's three whites are joined by a fourth, `System/White`.
