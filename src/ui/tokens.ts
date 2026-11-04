/**
 * UI tokens: Figma variables (src/ui/tokens.json) as CSS custom properties.
 *
 * Components never hold values: `token("Core/Blue")` gives `var(--ui-core-blue, #3385ff)`, and `tokenVars()` puts every
 * variable on the screen frame as `--ui-*`, so changing tokens.json (a re-sync from Figma) changes every component.
 * Typography variables are Figma `Font(...)` strings; `type("Web/body 14px-500")` turns one into CSS.
 */
import type { CSSProperties } from "react";
import data from "./tokens.json";

const VARIABLES: Record<string, string> = data.variables;

/** `Text/Primary (950)` → `--ui-text-primary-950`. */
export const cssName = (name: string) => "--ui-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Design font first, the app's web fallback after it (see src/app/layout.tsx). */
export const FONT_STACK = "'Cns Manrope', var(--font-manrope), Manrope, system-ui, sans-serif";

/** Resolve a variable to its raw value, following references to other variables (sizes, weights, families). */
export function value(name: string): string {
  const v = VARIABLES[name];
  if (v === undefined) throw new Error(`Unknown UI token “${name}” (add it to src/ui/tokens.json)`);
  return v;
}

/** A colour (or any plain) token as a CSS variable reference with its current value as the fallback. */
export function token(name: string): string {
  const v = value(name);
  if (v.startsWith("Font(") || v.startsWith("Effect(")) throw new Error(`“${name}” is not a plain token; use type() or effect()`);
  return `var(${cssName(name)}, ${cssColor(v)})`;
}

/** Figma writes 8-digit hex as RRGGBBAA; CSS reads it the same way, so only the shorthand check is needed. */
const cssColor = (v: string) => v;

function parseFont(v: string) {
  const get = (k: string) => v.match(new RegExp(`${k}: ("([^"]*)"|[^,)]*)`))?.[2] ?? v.match(new RegExp(`${k}: ([^,)]*)`))?.[1]?.trim();
  const deref = (x: string | undefined) => (x && VARIABLES[x] !== undefined ? VARIABLES[x] : x);
  return {
    family: deref(get("family")) ?? "Cns Manrope",
    size: Number(deref(get("size"))),
    weight: Number(deref(get("weight"))),
    lineHeight: Number(get("lineHeight")),
    letterSpacing: Number(get("letterSpacing")),
  };
}

/** A typography token as CSS. Figma's lineHeight 100 means "auto" (normal); 1.5 is a multiplier. */
export function type(name: string): CSSProperties {
  const f = parseFont(value(name));
  return {
    fontFamily: f.family === "Cns Manrope" ? FONT_STACK : f.family,
    fontSize: f.size,
    fontWeight: f.weight,
    lineHeight: f.lineHeight === 100 ? "normal" : f.lineHeight,
    letterSpacing: f.letterSpacing,
    fontStyle: "normal",
  };
}

/** A drop-shadow token as a CSS box-shadow. */
export function effect(name: string): string {
  const v = value(name);
  const m = v.match(/color: (#[0-9a-fA-F]+), offset: \(([-\d.]+), ([-\d.]+)\), radius: ([-\d.]+), spread: ([-\d.]+)/);
  if (!m) throw new Error(`Can't read effect token “${name}”`);
  return `${m[2]}px ${m[3]}px ${m[4]}px ${m[5]}px ${m[1]}`;
}

/** Every plain variable as a `--ui-*` custom property, for the screen frame's root element. */
export function tokenVars(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, v] of Object.entries(VARIABLES)) if (!v.startsWith("Font(") && !v.startsWith("Effect(")) out[cssName(name)] = v;
  return out;
}

export const tokenNames = () => Object.keys(VARIABLES);
