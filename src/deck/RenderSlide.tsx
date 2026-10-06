import { SlideFrame } from "./frame/SlideFrame";
import { patterns } from "./registry";
import type { Chrome, SlideData } from "./types";

/** Renders one slide at 1920×1080 design px. Wrap in <ScaledSlide> to fit a container. */
export function RenderSlide({ slide }: { slide: SlideData }) {
  const entry = patterns[slide.pattern];
  if (!entry) {
    return (
      <div style={{ width: 1920, height: 1080, display: "grid", placeItems: "center", background: "#fee", fontSize: 48 }}>
        Unknown pattern “{slide.pattern}”
      </div>
    );
  }
  const chrome: Chrome = { ...entry.meta.defaultChrome, ...slide.chrome };
  const { Component, Top } = entry;
  return (
    <SlideFrame chrome={chrome} top={Top ? <Top {...slide.props} /> : null}>
      <Component {...slide.props} />
    </SlideFrame>
  );
}
