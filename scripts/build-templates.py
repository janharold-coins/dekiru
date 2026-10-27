"""Build slide templates (src/content/templates.json) from approved Sales master slides.

A template is an approved slide with its words swapped for placeholders ("Title of the deck"),
kept close to the original length and line count so the layout stays balanced. People fill
them in with Dekiru's slide form. Images stay as in the approved slide until uploads exist.

Run after the Sales seed changes:  python3 scripts/build-templates.py
"""
import copy, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
_sales = json.loads((ROOT / "src/content/decks/sales.json").read_text())
SALES_ID = _sales["id"]
SALES = {s["id"]: s for s in _sales["slides"]}

# id, name, source slide, what it's for
TEMPLATES = [
    ("cover", "Cover", "s01", "Deck title and a short tagline, with optional client name and event details."),
    ("agenda", "Agenda", "s02", "Up to three topics you'll cover."),
    ("section", "Section divider", "s03", "Opens a major section."),
    ("subsection", "Sub-section divider", "s10", "Opens a part inside a section."),
    ("key-numbers", "Key numbers", "s04", "Two headline stats plus supporting figures."),
    ("timeline", "Timeline", "s05", "Milestones by year."),
    ("statement", "Statement and highlights", "s07", "A big statement with three proof points."),
    ("product-index", "Product overview", "s09", "Products grouped under up to three pillars."),
    ("product-hero", "Product intro", "s11", "Introduces one product with its image."),
    ("product-detail", "Product detail, rate chips", "s12", "Who it's for, what it is, APIs and rates."),
    ("product-detail-note", "Product detail, pricing note", "s15", "Same, with a written pricing note."),
    ("product-flow", "Product flow", "s13", "How it works in up to five steps."),
    ("card-grid", "Status cards", "s30", "Up to eight cards with statuses, e.g. corridors."),
    ("feature-cards", "Feature cards", "s38", "Up to five reasons or features."),
    ("cta-contact", "Contact", "s39", "Call to action with contact emails."),
    ("closing", "Closing", "s40", "Final slide."),
]

# Words for each kind of text. Long fields are padded with FILLER to the approved length.
BASE = {
    "title": "Slide title", "subtitle": "A short line that sets up this slide.",
    "tagline": "One line on what this product does", "eyebrow": "Section name",
    "description": "Describe this point in a sentence or two.", "body": "Explain the idea in a few clear sentences.",
    "who": "Who this is for, in a sentence.", "text": "Milestone or event", "caption": "Supporting detail",
    "label": "Label", "lead": "Lead-in line:", "note": "Source or footnote", "name": "Product name",
    "country": "Country", "rail": "Payment rail", "speed": "Speed / hours", "header": "Group name",
    "titleBold": "Product name", "parentTitle": "Section title", "leftText": "Earlier milestone",
    "bracketGroup": "20XX–20XX", "lines": "supporting line,", "what": "What the product does.",
    "keyApis": "API name, API name.", "subtext": "Pricing note.",
}
# Long fields are padded with these sentences to about the approved length.
MORE = ["Keep it short and specific.", "Say what matters to the client.", "Use plain words.",
        "One idea per line.", "Add a number if you have one.", "Cut anything that repeats."]
# Short fields keep their base words; spread over two lines when the approved text uses two.
SHORT = {"title", "titleBold", "name", "label", "eyebrow", "header", "country", "rail", "speed",
         "parentTitle", "text", "leftText", "bracketGroup", "lines", "lead", "caption", "keyApis", "note"}
TWO_LINE = {"title": "Short title\ngoes here", "label": "Label that\nwraps", "text": "Milestone\nor event"}
# Kept as approved: section labels, units, numbering, statuses and anything that isn't words.
KEEP = {"whoLabel", "whatLabel", "keyApisLabel", "pricingLabel", "unit", "n", "number", "status",
        "titleRegular", "email"}


def pad(base: str, target: int) -> str:
    """Base sentence plus whole filler sentences, up to about the target length."""
    out = base
    for extra in MORE:
        if len(out) >= target * 0.85:
            break
        if len(out) + 1 + len(extra) > target * 1.15:
            break
        out += " " + extra
    return out


def wrap(text: str, lines: int) -> str:
    """Spread words evenly over the given number of lines."""
    words = text.split()
    if lines <= 1 or len(words) < lines:
        return text
    total = len(text)
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(out) < lines - 1 and len(" ".join(cur)) >= total / lines:
            out.append(" ".join(cur)); cur = []
    if cur:
        out.append(" ".join(cur))
    return "\n".join(out)


def placeholder(key: str, original: str) -> str:
    base = BASE.get(key, "Text")
    n = original.count("\n") + 1
    if key in SHORT:
        return TWO_LINE[key] if n >= 2 and key in TWO_LINE else base
    return wrap(pad(base, len(original.replace("\n", " "))), n)


def scrub(value, key=""):
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if k == "figma":
                continue
            if k == "valueRuns":  # styled runs of a stat; the plain value is used instead
                continue
            out[k] = scrub(v, k)
        return out
    if isinstance(value, list):
        return [scrub(v, key) for v in value]
    if isinstance(value, str):
        if key == "year":
            return "20XX"
        if key == "value":
            return re.sub(r"\d", "0", value)
        if key in KEEP or value.startswith("/") or value.startswith("#") or re.fullmatch(r"[a-z0-9-]+", value):
            return value
        return placeholder(key, value)
    return value


def build():
    out = []
    for tid, name, src, use in TEMPLATES:
        s = SALES[src]
        props = scrub(copy.deepcopy(s["props"]))
        o = OVERRIDES.get(tid)
        if o:
            o(props)
        slide = {"id": tid, "pattern": s["pattern"], "props": props}
        if s.get("chrome"):
            slide["chrome"] = s["chrome"]
        out.append({"id": tid, "name": name, "use": use, "from": f"{SALES_ID}/{src}", "slide": slide})
    path = ROOT / "src/content/templates.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {len(out)} templates to {path.relative_to(ROOT)}")


def _cover(p):
    p["title"] = "Title of\nthe deck."
    p["subtitle"] = "Key point   ·   Key point   ·   Key point"
    p["topRight"] = ""
    p["bottomRight"] = ""


def _agenda(p):
    p["title"] = "What\nwe’ll cover."
    for i, it in enumerate(p["items"], 1):
        it["title"] = f"Topic {i}"
        it["description"] = "What this part covers, in a short line"


def _section(p):
    p["title"] = "Section title"
    p["subtitle"] = "What this section covers, in a short line"


def _subsection(p):
    p["title"] = "Sub-section"
    p["parentTitle"] = "Section title"


def _product_index(p):
    for run, word in zip(p.get("titleRuns", []), ["One. ", "Two. ", "Three."]):
        run["text"] = word
    for i, pillar in enumerate(p.get("pillars", []), 1):
        pillar["title"] = f"Pillar {i}"


def _closing(p):
    p["title"] = "Thank you"


def _cta(p):
    p["title"] = "Let’s get\nstarted."
    for c in p.get("contacts", []):
        c["email"] = "team@coins.ph"


def _chips(p):
    for c in p.get("pricing", {}).get("chips", []) or []:
        c["label"] = "Method"


OVERRIDES = {
    "cover": _cover, "agenda": _agenda, "section": _section, "subsection": _subsection,
    "product-index": _product_index, "closing": _closing, "cta-contact": _cta, "product-detail": _chips,
}

if __name__ == "__main__":
    build()
