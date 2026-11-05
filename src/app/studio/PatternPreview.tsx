import type { ReactNode } from "react";
import { RenderNode, type Extra } from "@/ui/RenderScreen";
import { FONT_STACK, token, tokenVars } from "@/ui/tokens";
import type { Node } from "@/ui/types";

/**
 * A UI pattern example on a phone-width white surface, in the app's font and tokens (the app, not the slide theme).
 * Live: accordions open and close, buttons press. `still` turns that off (card thumbnails inside a link).
 */
export function PatternFrame({ tree, extra, still, children }: { tree?: Node; extra?: Extra; still?: boolean; children?: ReactNode }) {
  return (
    <div className="studio-pattern-frame" style={{
      ...tokenVars(), background: token("Fill/Page (0)"), color: "#131b26", fontFamily: FONT_STACK, WebkitFontSmoothing: "antialiased",
      pointerEvents: still ? "none" : undefined,
    }}>
      {tree ? <RenderNode node={tree} extra={extra} /> : children}
    </div>
  );
}
