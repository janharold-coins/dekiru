import { SlideFrame } from "./frame/SlideFrame";
import { patterns } from "./registry";
import type { Chrome, SlideData } from "./types";
import { localize, type Lang } from "./i18n";

/**
 * Renders one slide at 1920×1080 design px. Wrap in <ScaledSlide> to fit a container.
 * `lang` shows the slide's translation when it has one (text only; layout and images stay).
 */
export function RenderSlide({ slide: source, lang = "en" }: { slide: SlideData; lang?: Lang }) {
  const slide = localize(source, lang);
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
    <SlideFrame chrome={chrome} lang={lang} top={Top ? <Top {...slide.props} /> : null}>
      <Component {...slide.props} />
    </SlideFrame>
  );
}
