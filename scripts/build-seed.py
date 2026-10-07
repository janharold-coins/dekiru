"""Turn the Figma extraction (specs/content/sNN.json) into the master deck seeds.

Output:
  src/content/decks/sales.json — a Deck: {id, title, slides:[{id, pattern, props, chrome?, hidden?, source}]}.
  src/content/decks/ramp.json  — a Deck whose slides are references ({id, ref:"sales/sNN"}) to Sales master
                                 slides, so a fix to a shared slide lands in both decks.
Each slide's `props` matches the pattern's TypeScript props in src/deck/patterns/*.
`figma` keys inside props carry pixel-exact overrides that reproduce the Figma file;
generated decks omit them and patterns fall back to measured/auto layout.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
C = ROOT / "specs" / "content"

def load(n):
    return json.loads((C / f"s{n:02d}.json").read_text())

def cage(layout):
    if not layout:
        return None
    vr = layout.get("vRight")
    if isinstance(vr, dict):
        vr = [vr]
    return {
        "x": layout["rulesX"], "width": layout["rulesWidth"], "ys": layout["rulesY"],
        "stroke": layout.get("strokeWidth", 1),
        "vLeft": layout.get("vLeft"), "vRight": vr or [],
    }

def cover(d):
    return {"title": d["texts"]["title"], "subtitle": d["texts"]["subtitle"]}

def agenda(d):
    return {"title": d["texts"]["title"], "items": d["items"]["agenda"]}

def section1(d):
    s = d.get("style", {})
    return {"level": 1, "number": d["texts"]["number"], "title": d["texts"]["title"],
            "subtitle": d["texts"]["subtitle"],
            "figma": {"titleWeight": s.get("titleWeight"), "subtitleLineHeight": s.get("subtitleLineHeight"),
                      "subtitleTracking": s.get("subtitleTracking"), "titleTop": s.get("titleTop"),
                      "subtitleTop": s.get("subtitleTop"), "cage": cage(d.get("layout"))}}

def section2(d):
    t = d["texts"]
    return {"level": 2, "number": t["parentNumber"], "parentTitle": t["parentTitle"],
            "title": t["title"], "subtitle": t["subtitle"]}

def key_numbers(d):
    t, it = d["texts"], d["items"]
    return {"title": t["title"], "subtitle": t["subtitle"],
            "callout": {"lead": t["calloutLead"].rstrip(), "lines": [l.rstrip() for l in t["calloutLines"]]},
            "statCards": [{"icon": f"/figma/s04/{c['icon']}", "tone": "orange" if c["id"] == "consumer" else "blue",
                           "value": c["value"], "valueRuns": c.get("valueRuns"), "eyebrow": c["eyebrow"],
                           "label": c["label"], "description": c["description"], "variant": c["id"]}
                          for c in it["statCards"]],
            "primaryStats": it["inlineStatsPrimary"], "secondaryStats": it["inlineStatsSecondary"]}

def timeline(d):
    return {"title": d["texts"]["title"], "subtitle": d["texts"]["subtitle"],
            "items": d["items"], "flags": d["flagTrack"]}

def logo_wall(d):
    return {"title": d["texts"]["title"], "body": d["texts"]["body"], "groups": d["items"]}

def statement(d):
    return {"title": d["texts"]["title"], "body": d["texts"]["body"], "highlights": d["items"]["highlights"]}

def product_index(d):
    return {"titleRuns": d["items"]["titleRuns"], "subtitle": d["texts"]["subtitle"], "pillars": d["items"]["pillars"]}

def hero(d):
    s = d["imageSlot"]
    return {"product": d["product"], "eyebrow": d["texts"]["eyebrow"], "title": d["texts"]["title"],
            "tagline": d["texts"]["tagline"],
            "image": {"src": d["assets"]["hero"], "variant": d.get("imageVariant", "mockup"),
                      "x": s["x"], "y": s["y"], "w": s["w"], "h": s["h"]}}

def detail(d):
    t = d["texts"]
    return {"product": d["product"], "eyebrow": t["eyebrow"], "title": t["title"], "tagline": t["tagline"],
            "description": t["description"], "whoLabel": t["whoLabel"], "who": t["who"],
            "whatLabel": t["whatLabel"], "what": d["what"], "keyApisLabel": t.get("keyApisLabel"),
            "keyApis": d["keyApis"], "pricingLabel": t["pricingLabel"], "pricing": d["pricing"],
            **({"figma": d["layout"]} if d.get("layout") else {})}

def flow(d):
    t = d["texts"]
    return {"product": d["product"], "eyebrow": t["eyebrow"], "titleBold": t["titleBold"],
            "titleRegular": t["titleRegular"], "steps": d["steps"]}

def card_grid(d):
    t = d["texts"]
    return {"eyebrow": t["sectionLabel"], "title": t["title"], "subtitle": t["subtitle"], "body": t["body"],
            "cards": d["items"]}

def feature_cards(d):
    return {"title": d["texts"]["title"],
            "cards": [{"number": c["number"], "title": c["title"].replace(" \n", "\n"), "body": c["body"].replace(" \n", "\n")}
                      for c in d["items"]],
            "decoration": "coins"}

def cta(d):
    return {"title": d["texts"]["title"], "subtitle": d["texts"]["subtitle"], "contacts": d["items"]["contacts"],
            "figma": {"cage": cage(d.get("layout"))}}

def closing(d):
    return {"title": d["texts"]["title"], "figma": {"cage": cage(d.get("layout"))}}

MAP = {
    "cover": ("cover", cover), "agenda": ("agenda", agenda), "section-l1": ("section", section1),
    "section-l2": ("section", section2), "key-numbers": ("key-numbers", key_numbers),
    "timeline": ("timeline", timeline), "logo-wall": ("logo-wall", logo_wall),
    "statement-highlights": ("statement-highlights", statement), "product-index": ("product-index", product_index),
    "product-hero": ("product-hero", hero), "product-detail": ("product-detail", detail),
    "product-flow": ("product-flow", flow), "card-grid": ("card-grid", card_grid),
    "feature-cards": ("feature-cards", feature_cards), "cta-contact": ("cta-contact", cta), "closing": ("closing", closing),
}

# Per-slide chrome deviations found in Figma (everything else uses the pattern's defaults).
CHROME = {
    20: {"footer": None},                 # footer hidden under the mockup in Figma
    33: {"footer": "bottom-left"},        # the one detail slide with the footer bottom-left
    39: {"background": "dark-navy"},
    40: {"background": "dark-navy"},
}

# Slides kept in the master but not presented.
#   20-22 Business Portal (Jan, 2026-10-07).
#   14-16 Virtual Accounts — not in "Sales Deck as of Jun5" PDF (2026-10-07). Un-hide to bring back.
HIDDEN = {14, 15, 16, 20, 21, 22}

# Presented order of the Sales deck (Figma positions). Follows "Sales Deck as of Jun5 (no biz portal).pdf":
# the Ramp kit (41-43, built in Figma after the main run) sits at the top of Trade, before OTC RFQ.
SALES_ORDER = list(range(1, 32)) + [41, 42, 43] + list(range(32, 41))

# Ramp deck, per "Ramp Deck as of Jun 5.pdf". Every slide is shared with Sales.
RAMP_ORDER = [1, 4, 5, 6, 41, 42, 43, 38, 11, 12, 13, 17, 18, 19, 23, 24, 25, 26, 27, 28, 29, 30, 39, 40]

slides = []
for n in SALES_ORDER:
    d = load(n)
    pattern, fn = MAP[d["pattern"]]
    s = {"id": f"s{n:02d}", "pattern": pattern, "props": fn(d), "source": {"figmaNode": d["node"], "slide": n}}
    if n in CHROME:
        s["chrome"] = CHROME[n]
    if n in HIDDEN:
        s["hidden"] = True
    if d.get("visualSource"):
        s["source"]["visualNode"] = d["visualSource"]["node"]
    slides.append(s)

OUT = ROOT / "src" / "content" / "decks"
deck = {"id": "sales", "title": "Coins.ph — Sales deck", "version": "figma-511:28902", "slides": slides}
(OUT / "sales.json").write_text(json.dumps(deck, ensure_ascii=False, indent=1))
print("wrote sales.json", len(slides), "slides,", sum(1 for s in slides if not s.get("hidden")), "presented")

assert not HIDDEN & set(RAMP_ORDER), "Ramp references a slide hidden in Sales"
ramp = {"id": "ramp", "title": "Coins.ph — Ramp deck", "version": "figma-511:28902",
        "slides": [{"id": f"s{n:02d}", "ref": f"sales/s{n:02d}"} for n in RAMP_ORDER]}
(OUT / "ramp.json").write_text(json.dumps(ramp, ensure_ascii=False, indent=1))
print("wrote ramp.json", len(ramp["slides"]), "slides")
