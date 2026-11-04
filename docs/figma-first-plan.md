# Dekiru UI — Figma-first plan

*2026-11-04 · agreed with Jan in chat · follows `dekiru-app-screens-plan.md` (decisions in §5) and the spike in `spike-ui-widget/`*

## 1. Why Figma-first

The `@coins/ui-widget` spike showed that a code library can only reproduce what it already has: the web product. The native app's look lives in Figma. So the source flips: **Figma defines screens and components; Dekiru derives code from it.** `@coins/ui-widget` becomes a mapping for the handoff ("this Figma component has this code equivalent"), not the thing screens are built from.

## 2. The approach: screen-driven, library-as-you-go

No design-system import. The unit of work is **one Figma screen**. Coding a screen produces the components it needs; later screens reuse them. The coded library is a by-product that grows one screen at a time, the way the deck patterns grew out of the Sales and Ramp decks.

The loop, per screen:

0. **Audit** the frame (no code yet): what is reusable, what is new, what is wrong in Figma. Stops for acceptance.
1. **Code the new components** the audit listed, each keyed by its Figma component key.
2. **Build the screen as data**: a tree of `{ component, props, children }` plus layout, props filled from the instances' overrides.
3. **Compare** the render with the Figma screenshot; list gaps; approve in the Studio.

## 3. Identity: how "same component" is known

Figma already answers it. An instance on a frame carries the **key of its main component** in the library (`componentKey`; variants add `variantProperties`). Ten instances of Button on ten frames carry the same key. Each coded component stores the key it was built from (as `src/deck/patterns/*` store `figmaNode`), and the renderer looks the key up before building anything:

```
instance on Frame A  →  componentKey "a1b2…"  →  src/ui/components/Button.tsx   (built once)
instance on Frame B  →  componentKey "a1b2…"  →  same file, reused; overrides become props
```

- **Variants** (`Button/Primary/Large`, `Button/Secondary/Small`) are one component set → one coded `Button` with `variant` and `size` props. An unseen variant is an addition to the existing component, not a new one.
- **Matching is by key only.** Never by name or by looks. Anything without a key is reported, not guessed.

## 4. Granularity

Rule for the renderer: **instance with a main component → component; frame without one → layout.**

- Code at the level the designer places on the screen (a `Balance row`, not its icon + name + amount; those are its props).
- Go one level down only when the screen does: a child that is swapped or overridden on a screen becomes a component, because screens address it directly.
- Recurring atoms (Button, Tag, Checkbox, NavBar) are always their own component; Figma marks them (own main component, `variantProperties`).
- Pure auto-layout frames become layout data (`direction`, `gap`, `padding`), never code.

Same triage as decks: block / variant / pattern / component.

**Patterns.** A repeated arrangement that is not itself a library component (a file-local component, or a frame copied across screens) is a **pattern**, as on the deck side: it lives in `src/ui/patterns/`, keyed by its local component key (or, for plain frames, by a fingerprint of its structure), and it is built **from** library components plus layout. The audit looks inside it and reports its composition: which library components it uses (coded as components, reused everywhere) and which parts are hand-built (layout, or a hygiene flag). A pattern whose insides are all library components is in good standing; one that redraws a Button by hand is flagged. Promoting a pattern to the library in Figma later is a rename of its key, not a rebuild.

## 5. Tokens

`get_variable_defs` (Figma connector) returns the **variables** a node uses, as `name → value` (`icon/default/secondary → #949494`; colour, spacing, type).

- `src/ui/tokens.json`: every variable met so far, keyed by Figma name, with value and source file. Grows with the screens.
- Components reference token names, never values (`token("text/primary")`); the token file becomes CSS custom properties on the screen frame, like deck themes.
- `npm run ui:sync-tokens` re-reads the variables for every held screen and component, diffs against `tokens.json`, writes changes, reports ("3 changed, 1 new, 0 removed"). The Studio shows the diff before it is accepted, so a renamed or retired token is a decision, not a silent break. Change a token in Figma, re-sync, every component follows.

Limits: `get_variable_defs` is per node, so we only see variables used by what we've imported (that is the incremental model; the library's token page can be read as a node if a full set is wanted). Modes (light / dark, PH / global) come through as the node's current mode; all modes at once needs the REST Variables API (Enterprise). Start with one mode.

## 6. The audit (step 0, the gate)

Point it at a frame; it reports five lists and **stops**:

| List | Meaning | What happens |
|---|---|---|
| **Known** | instances whose key is already coded | reused |
| **New** | instances with a key not yet coded, by name and variant | built, once accepted |
| **Patterns** | repeated arrangements that aren't library components (file-local components, copied frames), with their composition: library components inside, hand-built parts | built as patterns over the components they contain |
| **Detached** | frames with no key that look like components | not built: "re-attach in Figma, or confirm as layout" |
| **Local / duplicate** | a one-off local component that duplicates a library one | "swap for the library component, or accept as new" |
| **Tokens** | new or changed variables the frame uses | added / diffed |

Nothing is coded until the list is accepted (Studio, or chat for the first screens). Design-file hygiene gets fixed in Figma, at the source, instead of being baked into code. The audit is useful on its own: a designer can run it on any screen to check library compliance.

## 7. Where things live

| | Location | Keyed by |
|---|---|---|
| Coded components | `src/ui/components/*.tsx` (+ `registry.ts`, like `src/deck/registry.ts`) | Figma component key |
| Patterns | `src/ui/patterns/*.tsx`, composed from components | local component key, or structure fingerprint |
| Tokens | `src/ui/tokens.json` | Figma variable name |
| Screens | database, own tables (`screens`, `screen_versions`; decision 2 in the app-screens plan), with masters seeded from `src/content/screens/*.json` | Figma node id |
| Code mapping for handoff | `src/ui/code-connect.json`: Figma key → `@coins/ui-widget` export, where one exists | Figma component key |
| Rendering | one screen per iframe document under the token CSS variables (spike finding: breakpoints and inherited styles only behave that way) | — |

Home gets a **"UI (wip-alpha test)"** tab (decision 6).

## 8. Steps

| # | Step | Done means |
|---|---|---|
| 1 | **Audit tool.** `npm run ui:audit -- <figma url>` (and a Studio page): reads the frame through the Figma connector, prints the five lists. Stores nothing. | Run on the first screen Jan supplies; lists make sense to him |
| 2 | **Tokens.** `tokens.json`, `token()` helper, `ui:sync-tokens` with diff report | Re-running after a Figma change shows the change |
| 3 | **First components.** Code what the audit listed for screen 1, keyed by Figma key, props from variant properties and text slots; registry | Each renders beside its Figma screenshot in the Studio |
| 4 | **First screen as data + renderer.** Tree from the frame, layout from auto-layout, iframe render, compare view | Screen 1 renders; gaps listed |
| 5 | **Second screen.** Proves reuse: the audit's Known list is non-empty, only genuinely new components get built | Screen 2 with the reuse visible in the audit |
| 6 | **Persistence + UI tab.** `screens` tables, versions, the "UI (wip-alpha test)" tab, Studio approval of audits and components | Screens survive reload; visible on Home |
| 7 | **Handoff mapping.** `code-connect.json`, handoff view per screen: component tree, props, which have a `@coins/ui-widget` equivalent, copy table | Engineer can read it without asking |
| 8 | Later: translations on screens (existing i18n layer), prototype links (share links on a flow), more modes | — |

Steps 1–2 are independent; 3 needs 1; 4 needs 2 and 3; 5 needs 4. Step 1 is the first thing to do, before any component, so the Figma-reading code and the identity rule exist first.

## 9. Open until Jan sends it

- The Figma file for the app screens (not the Web Revamp Library V2) and the first screen to start with.
- Whether the app library is in the same file or a linked library file (affects the "Local / duplicate" check: library keys vs. file-local keys).

## 10. Rules carried over

- Code is canonical for *coded components*: once a component is built from Figma it is used as it is; screens don't restyle it. Changes go through Figma and a re-sync, or through the Studio.
- Never shrink text; budgets flag overflow (reused from decks).
- Never invent content: screens carry the text from Figma until someone edits it.
