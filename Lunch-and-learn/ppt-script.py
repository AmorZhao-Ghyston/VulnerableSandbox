"""
OWASP Top 10 (2025) - deck generator.

Slide formats:
  - Title slide, section divider (also used for the demo placeholder)
  - Intro (stat callouts), contents grid, comparison diagram, trends, references
  - Per topic: an overview (highlighted list) followed by one or more of the
    three content formats - bullets + key idea, three-step example, code
    comparison

Run:  .venv/Scripts/python.exe ppt-script.py
"""

import os
import sys
import textwrap

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt
from lxml import etree

# Optional first argument: where to write the deck (e.g. a preview copy)
OUTPUT_FILE = sys.argv[1] if len(sys.argv) > 1 else "OWASP-Top10-2025.pptx"

# Pictures. Topic intro slides use "<code>.png" (e.g. A04.png); the other
# slides use PICTURES. Anything missing falls back to PLACEHOLDER, so a new
# picture only needs dropping into the folder with the right name.
PLACEHOLDER = "placeholder.png"
PICTURES = {
    "intro": "part0-oh-wasp.jpg",  # What is OWASP?
    "demo": "ducks.gif",
    "discussion": "part-last-cat-thinking.png",
}
TITLE_STICKER = "duck.gif"


def image_for(path):
    return path if path and os.path.exists(path) else PLACEHOLDER


def topic_image(code):
    return image_for(f"{code}.png")


# --------------------------------------------------------------------------
# Theme
# --------------------------------------------------------------------------
PALE = RGBColor(0xBD, 0xD8, 0xF1)  # BDD8F1
MID = RGBColor(0x82, 0xA6, 0xCB)  # 82A6CB
BLUE = RGBColor(0x36, 0x67, 0xA6)  # 3667A6
NAVY = RGBColor(0x21, 0x41, 0x77)  # 214177
ACCENT = RGBColor(0xF2, 0xBC, 0x4B)  # warm amber accent - use sparingly
TINT = RGBColor(0xEE, 0xF4, 0xFA)  # very light wash of PALE, for cards/panels
INK = RGBColor(0x1F, 0x2A, 0x3C)  # body text
MUTED = RGBColor(0x5B, 0x6B, 0x80)  # captions, footer
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Calibri"
CODE_FONT = "Consolas"

SLIDE_W, SLIDE_H = 13.333, 7.5
MARGIN = 0.6
CONTENT_W = SLIDE_W - 2 * MARGIN

TOP_10 = [
    ("A01", "Broken Access Control", "Broken Access Control"),
    ("A02", "Security Misconfiguration", "Security Misconfiguration"),
    ("A03", "Software Supply Chain Failures", "Supply Chain Failures"),
    ("A04", "Cryptographic Failures", "Cryptographic Failures"),
    ("A05", "Injection", "Injection"),
    ("A06", "Insecure Design", "Insecure Design"),
    ("A07", "Authentication Failures", "Authentication Failures"),
    ("A08", "Software or Data Integrity Failures", "Data Integrity Failures"),
    ("A09", "Security Logging & Alerting Failures", "Logging & Alerting Failures"),
    ("A10", "Mishandling of Exceptional Conditions", "Exceptional Conditions"),
]

prs = Presentation()
prs.slide_width = Emu(12192000)  # 16:9, 13.333" x 7.5"
prs.slide_height = Emu(6858000)
BLANK = prs.slide_layouts[6]


def apply_theme_colours():
    """Write the palette into the theme, so PowerPoint's colour picker offers it
    and hyperlinks use the deck's blue rather than Office's default."""
    theme_part = prs.slide_master.part.part_related_by(RT.THEME)
    root = etree.fromstring(theme_part.blob)
    scheme = {"dk2": NAVY, "lt2": TINT, "accent1": BLUE, "accent2": NAVY,
              "accent3": MID, "accent4": PALE, "accent5": MUTED, "accent6": INK,
              "hlink": BLUE, "folHlink": NAVY}
    clr_scheme = root.find(".//" + qn("a:clrScheme"))
    clr_scheme.set("name", "OWASP Blue")
    for name, rgb in scheme.items():
        slot = clr_scheme.find(qn(f"a:{name}"))
        for child in list(slot):
            slot.remove(child)
        etree.SubElement(slot, qn("a:srgbClr")).set("val", str(rgb))
    theme_part._blob = etree.tostring(root, xml_declaration=True,
                                      encoding="UTF-8", standalone=True)


apply_theme_colours()


# --------------------------------------------------------------------------
# Low-level helpers
# --------------------------------------------------------------------------
def _write(tf, paragraphs, size=16, color=INK, bold=False, italic=False,
           align=PP_ALIGN.LEFT, font=FONT, space_after=0, line_spacing=None,
           char_spacing=None, bullet=False, bullet_color=BLUE):
    """Write paragraphs into a text frame.

    `paragraphs` is a string, or a list whose items are a string or a list of
    runs; a run is a string or a (text, {overrides}) tuple.
    """
    if isinstance(paragraphs, str):
        paragraphs = [paragraphs]
    for i, para in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if space_after:
            p.space_after = Pt(space_after)
        if line_spacing:
            p.line_spacing = line_spacing
        if bullet:
            _set_bullet(p, bullet_color)
        runs = [para] if isinstance(para, (str, tuple)) else para
        for r in runs:
            text, opts = (r, {}) if isinstance(r, str) else r
            run = p.add_run()
            run.text = text
            f = run.font
            f.name = opts.get("font", font)
            f.size = Pt(opts.get("size", size))
            f.bold = opts.get("bold", bold)
            f.italic = opts.get("italic", italic)
            f.color.rgb = opts.get("color", color)
            spacing = opts.get("char_spacing", char_spacing)
            if spacing:
                run._r.get_or_add_rPr().set("spc", str(int(spacing * 100)))
            if "link" in opts:
                run.hyperlink.address = opts["link"]


def _set_bullet(p, color=BLUE, indent=0.32):
    pPr = p._p.get_or_add_pPr()
    pPr.set("marL", str(Inches(indent)))
    pPr.set("indent", str(-Inches(indent)))
    bu_clr = etree.SubElement(pPr, qn("a:buClr"))
    etree.SubElement(bu_clr, qn("a:srgbClr")).set("val", str(color))
    etree.SubElement(pPr, qn("a:buFont")).set("typeface", "Arial")
    etree.SubElement(pPr, qn("a:buChar")).set("char", "•")


def _frame(tf, anchor=MSO_ANCHOR.TOP, margin=0.0):
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.vertical_anchor = anchor
    m = Inches(margin)
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = m


def text(slide, x, y, w, h, paragraphs, anchor=MSO_ANCHOR.TOP, **kw):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    _frame(box.text_frame, anchor)
    _write(box.text_frame, paragraphs, **kw)
    return box


def box(slide, x, y, w, h, fill=None, line=None, line_w=1.0, radius=0.08,
        shape=None, dash=False):
    """Rectangle (rounded by default, `radius` in inches; None = square)."""
    kind = shape or (MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE)
    shp = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    if radius and kind == MSO_SHAPE.ROUNDED_RECTANGLE:
        shp.adjustments[0] = min(0.5, radius / min(w, h))
    if fill is not None:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    else:
        shp.fill.background()
    if line is not None:
        shp.line.color.rgb = line
        shp.line.width = Pt(line_w)
        if dash:
            shp.line.dash_style = MSO_LINE.DASH
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    return shp


def label(shape, paragraphs, anchor=MSO_ANCHOR.MIDDLE, margin=0.0, **kw):
    """Put text inside an existing shape."""
    _frame(shape.text_frame, anchor, margin)
    _write(shape.text_frame, paragraphs, **kw)
    return shape


def badge(slide, x, y, size, code, fill=NAVY, color=WHITE, font_size=None):
    """The deck's motif: a rounded square carrying a code (A01, 02, ...)."""
    shp = box(slide, x, y, size, size, fill=fill, radius=size * 0.18)
    label(shp, code, size=font_size or size * 22, bold=True, color=color,
          align=PP_ALIGN.CENTER)
    return shp


def kicker_mark(slide, x, y):
    """Small amber square in front of every kicker - a mini version of the badge."""
    box(slide, x, y + 0.01, 0.16, 0.16, fill=ACCENT, radius=0.04)


def corner_circles(slide, cx, cy):
    """Decorative overlapping circles, partly off the slide edge."""
    def circle(x, y, d, **kw):
        return box(slide, x - d / 2, y - d / 2, d, d, shape=MSO_SHAPE.OVAL,
                   radius=None, **kw)
    circle(cx, cy, 5.2, fill=BLUE)
    circle(cx - 2.2, cy - 1.0, 2.4, line=MID, line_w=1.5)
    circle(cx - 3.1, cy - 2.4, 0.45, fill=ACCENT)


def line(slide, x1, y1, x2, y2, color=MID, width=1.5, dash=False):
    conn = slide.shapes.add_connector(
        MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    conn.line.color.rgb = color
    conn.line.width = Pt(width)
    if dash:
        conn.line.dash_style = MSO_LINE.DASH
    return conn


def background(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def notes(slide, body):
    slide.notes_slide.notes_text_frame.text = body


# --------------------------------------------------------------------------
# Slide frames
# --------------------------------------------------------------------------
def dark_slide():
    slide = prs.slides.add_slide(BLANK)
    background(slide, NAVY)
    return slide


def content_slide(kicker, title):
    """Light content frame: kicker + title top-left, footer at the bottom.

    Every light slide uses the same title position, size and footer.
    """
    slide = prs.slides.add_slide(BLANK)
    background(slide, WHITE)
    if kicker:
        kicker_mark(slide, MARGIN, 0.5)
        text(slide, MARGIN + 0.26, 0.5, CONTENT_W, 0.3, kicker.upper(), size=12,
             bold=True, color=BLUE, char_spacing=1.5)
    text(slide, MARGIN, 0.82, CONTENT_W, 0.75, title, size=36, bold=True, color=NAVY)
    footer(slide)
    return slide


def footer(slide, x=MARGIN):
    number = len(prs.slides)
    text(slide, x, 6.95, 6, 0.25, "OWASP Top 10  ·  2025", size=10, color=MUTED)
    text(slide, SLIDE_W - MARGIN - 1, 6.95, 1, 0.25, str(number), size=10,
         color=MUTED, align=PP_ALIGN.RIGHT)


# --------------------------------------------------------------------------
# Slide builders
# --------------------------------------------------------------------------
def title_slide():
    slide = dark_slide()
    corner_circles(slide, SLIDE_W - 0.4, SLIDE_H + 0.9)
    text(slide, 0.9, 2.0, 6.2, 0.35, "LUNCH & LEARN", size=14, bold=True,
         color=ACCENT, char_spacing=3)
    text(slide, 0.9, 2.45, 6.4, 1.2, "OWASP Top 10", size=60, bold=True, color=WHITE)
    text(slide, 0.9, 3.6, 6.2, 1.02, ["An introduction to the 2025 list",
                                       "(and some other security topics)"],
         size=26, color=PALE)
    text(slide, 0.9, 5.9, 6.2, 0.35, "Amor Zhao  ·  October 2026", size=14,
         color=MID)

    # Motif: the ten codes as a grid of badges
    size, gap = 0.9, 0.18
    x0, y0 = SLIDE_W - MARGIN - (5 * size + 4 * gap), 2.55
    for i, (code, _, _) in enumerate(TOP_10):
        row, col = divmod(i, 5)
        fill = BLUE if (row + col) % 2 == 0 else NAVY
        shp = badge(slide, x0 + col * (size + gap), y0 + row * (size + gap), size,
                    code, fill=fill, color=WHITE, font_size=18)
        if fill == NAVY:
            shp.line.color.rgb = BLUE
            shp.line.width = Pt(1.25)
    if os.path.exists(TITLE_STICKER):  # animated GIFs keep playing in PowerPoint
        slide.shapes.add_picture(TITLE_STICKER, Inches(7.1), Inches(5.72),
                                 height=Inches(1.46))
    notes(slide, "Welcome. A quick tour of the 2025 OWASP Top 10, what's changed "
                 "since 2021, and a short demo at the end.")


def divider_slide(title, subtitle, image, kicker=None):
    """Divider for the standalone parts (Demo, Discussion), in the same light
    frame as the introduction: title top-left, subtitle below, picture right."""
    slide = content_slide(kicker, title)
    if subtitle:
        text(slide, MARGIN, 2.0, 5.7, 1.2, subtitle, size=16, color=INK,
             line_spacing=0.95)
    picture(slide, image_for(image), 6.7, 1.9, SLIDE_W - MARGIN - 6.7, 4.75)
    return slide


def intro_slide():
    slide = content_slide("Introduction", "What is OWASP?")
    text(slide, MARGIN, 2.0, 5.7, 1.2,
         "The Open Worldwide Application Security Project", size=26, bold=True,
         color=BLUE, line_spacing=0.95)
    text(slide, MARGIN, 3.35, 5.6, 3.2, [
        "A non-profit community producing free, open guidance on building "
        "secure software.",
        "Its best-known project is the Top 10: a ranked list of the most "
        "critical risks facing web applications.",
        "Typically updated every 3–4 years.",
        "The latest edition is the 2025 list.",
    ], size=18, color=INK, space_after=12, line_spacing=1.1)
    picture(slide, image_for(PICTURES.get("intro")), 6.7, 3.05,
            SLIDE_W - MARGIN - 6.7, 3.45, valign_top=True)
    notes(slide, "OWASP = Open Worldwide Application Security Project. "
                 "The Top 10 is typically refreshed every three to four years.")


def contents_slide():
    slide = content_slide("Contents", "The 2025 list")
    col_w, gap_x, row_h, step = (CONTENT_W - 0.4) / 2, 0.4, 0.78, 0.94
    for i, (code, name, _) in enumerate(TOP_10):
        col, row = divmod(i, 5)
        x = MARGIN + col * (col_w + gap_x)
        y = 1.95 + row * step
        box(slide, x, y, col_w, row_h, fill=TINT)
        badge(slide, x, y, row_h, code, font_size=18)
        text(slide, x + row_h + 0.3, y, col_w - row_h - 0.4, row_h, name, size=20,
             color=INK, anchor=MSO_ANCHOR.MIDDLE)


def _lines(s, size, width, em=0.5):
    """Rough line count for wrapped text (Calibri ~0.5em average glyph width)."""
    per_line = max(1, int(width / (size * em / 72)))
    return len(textwrap.wrap(s, per_line)) or 1


def _plain(p):
    """Text of a paragraph that may be a list of plain or (text, style) runs."""
    if isinstance(p, str):
        return p
    return "".join(r if isinstance(r, str) else r[0] for r in p)


def picture(slide, path, x, y, max_w, max_h, align_right=True, valign_top=False,
            landscape_centre=None, radius=0.12):
    """Place an image, unframed, scaled to fit max_w x max_h (any orientation).

    Returns the width used. Corners are softly rounded so it sits with the cards.
    `landscape_centre` (a y position) centres wide pictures on that line instead.
    """
    with Image.open(path) as im:
        ratio = im.width / im.height
    w = min(max_w, max_h * ratio)
    h = w / ratio
    px = x + (max_w - w) if align_right else x
    py = y if valign_top else y + (max_h - h) / 2
    if landscape_centre is not None and ratio > 1:
        py = landscape_centre - h / 2
    pic = slide.shapes.add_picture(path, Inches(px), Inches(py), Inches(w), Inches(h))
    geom = pic._element.spPr.find(qn("a:prstGeom"))
    geom.set("prst", "roundRect")
    av = geom.find(qn("a:avLst"))
    if av is None:
        av = etree.SubElement(geom, qn("a:avLst"))
    etree.SubElement(av, qn("a:gd"), name="adj",
                     fmla=f"val {int(radius / min(w, h) * 100000)}")
    return w


def topic_overview_slide(code, tagline, description, rank_2021, rank_2025,
                         examples=(), key_line=None, note=""):
    """Left: the Top 10 with this topic highlighted.
    Top row: badge + topic name. Below: tagline, description and ranks on the
    left, the topic's picture (<code>.png, else the placeholder) on the right.

    `examples` are short bullet lines under the description; `key_line` is an
    optional bold takeaway above the ranks."""
    slide = prs.slides.add_slide(BLANK)
    background(slide, WHITE)

    # List panel - dot, codes and highlight share one left edge
    panel_w, list_x, name_x = 3.4, 0.4, 1.0
    box(slide, 0, 0, panel_w, SLIDE_H, fill=TINT, radius=None)
    kicker_mark(slide, list_x, 0.55)
    text(slide, list_x + 0.26, 0.55, panel_w - list_x - 0.3, 0.3, "THE TOP 10",
         size=12, bold=True, color=BLUE, char_spacing=1.5)
    row_h, step, y0 = 0.46, 0.53, 1.0
    for i, (c, _, short) in enumerate(TOP_10):
        y = y0 + i * step
        current = c == code
        if current:
            box(slide, 0.22, y, panel_w - 0.44, row_h, fill=BLUE)
        text(slide, list_x, y, 0.6, row_h, c, size=13, bold=True,
             color=WHITE if current else MID, anchor=MSO_ANCHOR.MIDDLE)
        text(slide, name_x, y, panel_w - name_x - 0.3, row_h, short, size=13,
             bold=current, color=WHITE if current else MUTED,
             anchor=MSO_ANCHOR.MIDDLE)

    # Top row: badge + full topic name
    x = panel_w + 0.6
    right = SLIDE_W - MARGIN
    full_name = next(n for c, n, _ in TOP_10 if c == code)
    badge_size, row_y = 0.9, 0.8
    badge(slide, x, row_y, badge_size, code, font_size=22)
    title_x = x + badge_size + 0.4
    text(slide, title_x, row_y, right - title_x, badge_size, full_name, size=30,
         bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)

    # Below: text column on the left, picture on the right. Tall pictures line
    # up with the tagline; wide ones sit in the middle of the text column.
    body_y, col_w, pic_x = 2.2, 4.1, 8.6
    picture(slide, topic_image(code), pic_x, body_y, right - pic_x,
            6.55 - body_y, align_right=False, valign_top=True,
            landscape_centre=(body_y + 6.1) / 2)

    y = body_y
    n = _lines(tagline, 18, col_w, em=0.40)
    text(slide, x, y, col_w, n * 0.32, tagline, size=18, italic=True, color=BLUE)
    y += n * 0.32 + 0.3
    n = _lines(description, 16, col_w, em=0.45)
    text(slide, x, y, col_w, n * 0.3, description, size=16, color=INK,
         line_spacing=1.1)
    y += n * 0.3 + 0.15
    if examples:
        n = sum(_lines(_plain(e), 16, col_w - 0.32, em=0.43) for e in examples)
        h = n * 0.27 + 0.06 * len(examples)
        text(slide, x, y, col_w, h, list(examples), size=16, color=INK,
             bullet=True, bullet_color=ACCENT, space_after=4)
        y += h + 0.1
    if key_line:
        lines = key_line.split("\n")
        n = sum(_lines(k, 22, col_w, em=0.45) for k in lines)
        text(slide, x, y + 0.1, col_w, n * 0.37, lines, size=22, bold=True,
             color=NAVY, line_spacing=0.95)
        y += n * 0.37 + 0.25
    y = min(y + 0.25, 6.2)  # never closer than this to the footer

    # Rank chips: 2021 -> 2025, directly under the description
    chip_w, chip_h, gap = 1.45, 0.46, 0.5
    for i, (yr, rank) in enumerate([("2021", rank_2021), ("2025", rank_2025)]):
        cx = x + i * (chip_w + gap)
        chip = box(slide, cx, y, chip_w, chip_h, fill=ACCENT if i else WHITE,
                   line=None if i else MID, radius=0.23)
        label(chip, [[(f"{yr}  ", {"color": MUTED}), (rank, {"bold": True})]],
              size=14, color=NAVY, align=PP_ALIGN.CENTER)
    text(slide, x + chip_w, y, gap, chip_h, "\u2192", size=18, color=MID,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    footer(slide, x=x)
    if note:
        notes(slide, note)
    return slide


def kicker_for(code, suffix=None):
    name = next(n for c, n, _ in TOP_10 if c == code)
    return f"{code}  \u00b7  {suffix or name}"


def bullets_slide(code, title, bullets, key_idea, key_sub, note=""):
    """Content format 1: bullet points on the left, key idea panel on the right."""
    slide = content_slide(kicker_for(code), title)
    text(slide, MARGIN, 2.05, 6.9, 4.4, bullets, size=20, color=INK,
         space_after=18, bullet=True, line_spacing=1.05, bullet_color=ACCENT)

    px, pw = 8.1, SLIDE_W - MARGIN - 8.1
    box(slide, px, 2.05, pw, 3.9, fill=TINT)
    text(slide, px + 0.45, 2.45, pw - 0.9, 0.3, "KEY IDEA", size=12, bold=True,
         color=BLUE, char_spacing=1.5)
    text(slide, px + 0.45, 2.9, pw - 0.9, 1.7, key_idea, size=28, bold=True,
         color=NAVY, line_spacing=0.95)
    text(slide, px + 0.45, 4.65, pw - 0.9, 1.0, key_sub, size=16, color=INK)
    if note:
        notes(slide, note)


def steps_slide(code, title, steps, prevent, note=""):
    """Content format 2: a three-step example walkthrough plus the fix."""
    slide = content_slide(kicker_for(code, "Example"), title)
    arrow_w = 0.5
    card_w = (CONTENT_W - 2 * arrow_w) / 3
    y, h = 2.0, 3.0
    for i, (head, mono, body) in enumerate(steps):
        x = MARGIN + i * (card_w + arrow_w)
        box(slide, x, y, card_w, h, fill=TINT)
        badge(slide, x + 0.35, y + 0.35, 0.55, str(i + 1), fill=ACCENT,
              color=NAVY, font_size=18)
        text(slide, x + 1.1, y + 0.35, card_w - 1.4, 0.55, head, size=20, bold=True,
             color=NAVY, anchor=MSO_ANCHOR.MIDDLE)
        pill = box(slide, x + 0.35, y + 1.2, card_w - 0.7, 0.6, fill=WHITE, line=MID,
                   radius=0.3)
        label(pill, mono, font=CODE_FONT, size=15, color=NAVY if i < 2 else BLUE,
              bold=i == 1, align=PP_ALIGN.CENTER)
        text(slide, x + 0.35, y + 2.0, card_w - 0.7, 0.9, body, size=16, color=INK)
        if i < 2:
            text(slide, x + card_w, y, arrow_w, h, "\u203a", size=40, color=MID,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    fix = box(slide, MARGIN, 5.4, CONTENT_W, 0.95, fill=NAVY)
    label(fix, [[("How to prevent it   ", {"bold": True, "color": ACCENT}),
                 (prevent, {"color": WHITE})]], size=18, margin=0.35)
    if note:
        notes(slide, note)


def code_slide(code, title, bad, good, note=""):
    """Content format 3: weak vs better code, side by side.

    `bad` / `good` are (tag, code, caption) - caption is a list of runs.
    """
    slide = content_slide(kicker_for(code, "Example"), title)
    col_w = (CONTENT_W - 0.4) / 2
    longest = max(len(l) for _, src, _ in (bad, good) for l in src.split("\n"))
    code_size = 17 if longest <= 34 else 15
    for i, (tag, src, caption) in enumerate((bad, good)):
        safe = i == 1
        x = MARGIN + i * (col_w + 0.4)
        chip = box(slide, x, 2.0, 2.2, 0.42, fill=BLUE if safe else WHITE,
                   line=None if safe else NAVY, radius=0.21)
        label(chip, tag, size=12, bold=True, color=WHITE if safe else NAVY,
              align=PP_ALIGN.CENTER, char_spacing=1.5)
        panel = box(slide, x, 2.65, col_w, 2.75, fill=NAVY)
        label(panel, src.split("\n"), font=CODE_FONT, size=code_size, color=PALE,
              anchor=MSO_ANCHOR.TOP, margin=0.35)
        text(slide, x, 5.6, col_w, 0.8, [caption], size=16, color=INK)
    if note:
        notes(slide, note)



def connector(slide, x1, y1, x2, y2, color, width, dash=False, stub=0.3):
    """Row-to-row link: short horizontal stubs out of each block, a straight run
    between them, a dot where it leaves and an arrowhead where it lands - so
    even where links cross it's clear which row joins which."""
    points = [(x1, y1), (x1 + stub, y1), (x2 - stub, y2), (x2, y2)]
    for i, ((ax, ay), (bx, by)) in enumerate(zip(points, points[1:])):
        seg = line(slide, ax, ay, bx, by, color=color, width=width, dash=dash)
        ln = seg._element.spPr.find(qn("a:ln"))
        ln.set("cap", "rnd")  # round caps so the segments join cleanly
        if i == len(points) - 2:
            etree.SubElement(ln, qn("a:tailEnd"), type="triangle", w="med",
                             len="med")
    d = 0.11
    box(slide, x1 - d / 2, y1 - d / 2, d, d, fill=color, shape=MSO_SHAPE.OVAL,
        radius=None)


def comparison_slide():
    slide = content_slide("Comparison", "2021 vs 2025: what moved")
    list_2021 = [
        "Broken Access Control", "Cryptographic Failures", "Injection",
        "Insecure Design", "Security Misconfiguration",
        "Vulnerable and Outdated Components",
        "Identification and Authentication Failures",
        "Software and Data Integrity Failures",
        "Security Logging and Monitoring Failures",
        "Server Side Request Forgery (SSRF)",
    ]
    # 2021 index -> 2025 index, style
    moves = {0: (0, "same"), 1: (3, "down"), 2: (4, "down"), 3: (5, "down"),
             4: (1, "up"), 5: (2, "up"), 6: (6, "same"), 7: (7, "same"),
             8: (8, "same"), 9: (0, "merged")}
    styles = {"up": (BLUE, 2.5, False), "down": (MID, 2.0, False),
              "same": (PALE, 2.5, False), "merged": (MID, 1.75, True)}

    col_w, row_h, step, y0 = 4.55, 0.36, 0.42, 2.1
    left_x, right_x = MARGIN, SLIDE_W - MARGIN - col_w
    text(slide, left_x, 1.7, col_w, 0.35, "2021", size=18, bold=True, color=MUTED)
    text(slide, right_x, 1.7, col_w, 0.35, "2025", size=18, bold=True, color=NAVY)

    def row(x, y, code, name, current, tag=None):
        """2021 rows are light blocks; 2025 rows are dark blocks, white text."""
        box(slide, x, y, col_w, row_h, fill=NAVY if current else TINT, radius=0.08)
        text(slide, x + 0.15, y, 0.55, row_h, code, size=12, bold=True,
             color=PALE if current else MID, anchor=MSO_ANCHOR.MIDDLE)
        text(slide, x + 0.75, y, col_w - 0.85, row_h, name, size=12,
             color=WHITE if current else MUTED, anchor=MSO_ANCHOR.MIDDLE)
        if tag:
            t = box(slide, x + col_w - 0.68, y + 0.06, 0.58, row_h - 0.12,
                    fill=ACCENT, radius=0.12)
            label(t, tag, size=9, bold=True, color=NAVY, align=PP_ALIGN.CENTER)

    for i, name in enumerate(list_2021):
        row(left_x, y0 + i * step, f"A{i + 1:02d}", name, current=False)
    for i, (code, name, _) in enumerate(TOP_10):
        tag = "NEW" if code == "A10" else None
        row(right_x, y0 + i * step, code, name, current=True, tag=tag)

    # Links: quiet ones first so the moves sit on top
    lx, rx = left_x + col_w + 0.08, right_x - 0.04
    order = sorted(moves.items(), key=lambda m: ["same", "merged", "down", "up"]
                   .index(m[1][1]))
    for src, (dst, kind) in order:
        color, width, dash = styles[kind]
        connector(slide, lx, y0 + src * step + row_h / 2, rx,
                  y0 + dst * step + row_h / 2, color, width, dash)

    # Legend
    ly = 6.55
    for i, (kind, caption) in enumerate([("up", "Moved up"), ("down", "Moved down"),
                                         ("same", "Held position"),
                                         ("merged", "Merged in")]):
        color, width, dash = styles[kind]
        lx0 = MARGIN + i * 2.3
        connector(slide, lx0 + 0.05, ly + 0.12, lx0 + 0.6, ly + 0.12, color, width,
                  dash, stub=0.1)
        text(slide, lx0 + 0.75, ly, 1.5, 0.25, caption, size=11, color=MUTED)
    notes(slide, "Misconfiguration jumps from 5 to 2: cloud platforms are more "
                 "complex and harder to configure. Supply chain grows out of "
                 "'Vulnerable and Outdated Components'. Cryptographic failures drop "
                 "as browsers and frameworks enforce better defaults. SSRF is now "
                 "part of Broken Access Control.")


def trends_slide():
    slide = content_slide("Trends", "The bigger picture")
    trends = [
        ("Cloud & DevOps mistakes", "Complex cloud permissions push misconfiguration to #2."),
        ("Supply chain attacks", "We inherit code – and whatever is hidden in it."),
        ("Design-level security", "Some flaws can’t be patched later; they must be designed out."),
        ("Detection & response", "An attack nobody is alerted to can run for months."),
    ]
    gap = 0.3
    w = (CONTENT_W - 3 * gap) / 4
    y, h = 1.95, 3.3
    for i, (head, body) in enumerate(trends):
        x = MARGIN + i * (w + gap)
        box(slide, x, y, w, h, fill=TINT)
        badge(slide, x + 0.35, y + 0.35, 0.65, f"{i + 1}", fill=ACCENT,
              color=NAVY, font_size=20)
        text(slide, x + 0.35, y + 1.2, w - 0.7, 0.75, head, size=19, bold=True,
             color=NAVY, line_spacing=0.95)
        text(slide, x + 0.35, y + 2.05, w - 0.7, 1.1, body, size=15, color=INK)

    band = box(slide, MARGIN, 5.55, CONTENT_W, 0.95, fill=NAVY)
    label(band, "Shifting away from simple code bugs, and towards the architecture "
                "of the product.", size=18, color=WHITE, margin=0.35)


def references_slide(refs):
    """Plain list: number, title, link, hairline between rows. Room to grow."""
    slide = content_slide("The links", "References")
    row_h, y0 = 0.5, 1.95
    for i, (title, shown, url) in enumerate(refs):
        y = y0 + i * row_h
        text(slide, MARGIN, y, 0.5, row_h, f"{i + 1}.", size=16, color=MUTED,
             anchor=MSO_ANCHOR.MIDDLE)
        text(slide, MARGIN + 0.5, y, 5.6, row_h, title, size=16, color=INK,
             anchor=MSO_ANCHOR.MIDDLE)
        text(slide, MARGIN + 6.3, y, CONTENT_W - 6.3, row_h,
             [[(shown, {"link": url, "color": BLUE})]], size=16,
             anchor=MSO_ANCHOR.MIDDLE)
        line(slide, MARGIN, y + row_h, SLIDE_W - MARGIN, y + row_h, color=PALE,
             width=0.75)



# --------------------------------------------------------------------------
# Deck
# --------------------------------------------------------------------------
B = {"bold": True, "color": NAVY}  # bold run inside a bullet

title_slide()
intro_slide()
contents_slide()

# A01 - Broken Access Control
topic_overview_slide(
    "A01", "What can you do once you’re in?",
    "Users can do things they shouldn’t be allowed to because the "
    "system confuses who they are with what they’re permitted to do.",
    "#1", "#1",
    examples=[[("Authentication", B), " checks who you are"],
              [("Authorisation", B), " decides what you’re allowed to do"]],
    note="Still number one. Getting it right takes a real understanding of "
         "the system's permission model.")

# A02 - Security Misconfiguration
topic_overview_slide(
    "A02", "Not a code bug – a setup bug",
    "The code may be fine, but the environment around it is configured in a "
    "way that leaves the doors open.",
    "#5", "#2",
    examples=["Debug mode left switched on in production",
              "Full error messages shown to the public",
              [("Files such as ", {}), (".env", {"font": CODE_FONT, "color": NAVY}),
               (" downloadable from the site", {})],
              "Default passwords never changed"],
    note="Up from fifth. Cloud platforms (AWS, Azure...) have made "
         "configuration, especially permissions, much harder to get right.")

# A03 - Software Supply Chain Failures
topic_overview_slide(
    "A03", "When a dependency turns against you",
    "Most of our code is inherited. If a library we rely on is poisoned, its "
    "malicious code runs with our permissions.",
    "#6", "#3",
    note="Effectively new for 2025 – it expands 2021's 'Vulnerable & "
         "Outdated Components' to cover the whole supply chain. A poisoned "
         "library can quietly send customer data out, mine crypto on the "
         "server or open a back door. Pin versions, review updates and scan "
         "dependencies (e.g. npm audit).")

# A04 - Cryptographic Failures
topic_overview_slide(
    "A04", "Secrets that aren’t really secret",
    "Sensitive data is exposed because it’s weakly protected (or "
    "not protected at all).",
    "#2", "#4",
    note="Down from second. Browsers warn about and force upgrades, and modern "
         "frameworks hash passwords properly by default.")
code_slide(
    "A04", "Hashing passwords",
    ("WEAK",
     "using var md5 = MD5.Create();\nvar hash = md5.ComputeHash(\n"
     "  Encoding.UTF8.GetBytes(password));",
     [("Fast and unsalted – cracked in seconds", {})]),
    ("RECOMMENDED",
     "var hasher =\n  new PasswordHasher<User>();\nvar hash = hasher.HashPassword(\n"
     "  user, password);",
     [("Salted and deliberately slow, built into ASP.NET Core Identity", {})]),
    note="Other classics: no HTTPS across the whole site, and API keys "
         "hard-coded into public-facing scripts.")

# A05 - Injection
topic_overview_slide(
    "A05", "When data is treated as code",
    "Untrusted input is passed straight into a query or command, so the "
    "attacker’s text is executed rather than stored.",
    "#3", "#5",
    note="A classic. SQL and command injection.")
code_slide(
    "A05", "Building SQL from strings",
    ("VULNERABLE",
     'var sql =\n  "SELECT * FROM Users " +\n  "WHERE Name LIKE \'%" +\n'
     '  request.Query + "%\'";\nFromSqlRaw(sql);',
     [("Input  ", B), ("' OR '1'='1", {"font": CODE_FONT, "color": BLUE}),
      ("  dumps the entire table", {})]),
    ("PARAMETERISED",
     "var users = db.Users\n  .Where(u =>\n    u.Name.Contains(query))\n  .ToList();",
     [("The input is only ever treated as a value, never as SQL", {})]),
    note="This mirrors the SearchUsers endpoint in the demo app. Raw SQL built "
         "by concatenation is what makes it vulnerable.")

# A06 - Insecure Design
topic_overview_slide(
    "A06", "A flaw in the blueprint",
    "A logic gap nobody considered at design time – so there’s no "
    "single line of code to fix, and it’s hard to patch later.",
    "#4", "#6",
    examples=["E.g. unlimited code attempts"],
    note="Must be designed out with threat modelling. Unlimited one-time-code "
         "attempts let a simple script try every combination; no rate "
         "limiting is another classic.")

# A07 - Authentication Failures
topic_overview_slide(
    "A07", "Can you get in at all?",
    "Weak login defences make it easy for attackers to pass themselves off "
    "as someone else.",
    "#7", "#7",
    examples=["Sessions never expire", "No MFA", "Weak passwords allowed"],
    key_line="A01 asks what you can do.\nA07 asks if you should be in.",
    note="If the system lets users pick weak passwords or leaves sessions "
         "vulnerable, it's easy to break into.")

# A08 - Software or Data Integrity Failures
topic_overview_slide(
    "A08", "Trusting without checking the seal",
    "Code or data is accepted without verifying where it came from, or "
    "whether it’s been tampered with.",
    "#8", "#8",
    examples=[[("How to prevent it: ", B), "sign artefacts and verify "
               "checksums before anything is deployed"]],
    note="Failing to perform checksum or signature validation.")

# A09 - Security Logging & Alerting Failures
topic_overview_slide(
    "A09", "Silence while the attack happens",
    "Without logs and alerts, attacks go unnoticed – and breaches "
    "can’t be investigated afterwards.",
    "#9", "#9",
    examples=["No alert when someone brute-forces a login",
              "Logs missing, or kept only on the compromised server",
              "Alerts that exist, but nobody acts on",
              "No trail to find where a leak happened"])

# A10 - Mishandling of Exceptional Conditions
topic_overview_slide(
    "A10", "What happens when things go wrong?",
    "Errors aren’t handled gracefully, so the app leaks information or "
    "skips its own security checks.",
    "–", "#10",
    note="New for 2025. Think server disk filling up, or the network dropping "
         "mid-transaction. Leaked stack traces and code that 'fails open' "
         "(an exception that skips a permission check) are the classics.")

comparison_slide()
trends_slide()

divider_slide("Demo", "", PICTURES["demo"],
              kicker="Placeholder slide for my vulnerable sandbox")

references_slide([
    ("OWASP Top 10:2025", "owasp.org/Top10/2025", "https://owasp.org/Top10/2025/"),
    ("OWASP Top 10:2021", "owasp.org/Top10/2021", "https://owasp.org/Top10/2021/"),
    ("OWASP Cheat Sheet Series", "cheatsheetseries.owasp.org",
     "https://cheatsheetseries.owasp.org/"),
    ("OWASP Foundation", "owasp.org", "https://owasp.org/"),
])

divider_slide("Discussion", "Let’s talk about stuff … (or not)",
              PICTURES["discussion"], kicker="THE LAST SECTION")

prs.save(OUTPUT_FILE)
print(f"Saved {OUTPUT_FILE} ({len(prs.slides)} slides)")