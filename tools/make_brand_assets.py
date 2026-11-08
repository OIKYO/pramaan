"""Draw Pramaan's own logo as vectors, from the PNG the team designed.

    python tools/make_brand_assets.py --fonts <folder with Poppins-Medium.ttf and Poppins-Regular.ttf>
    python tools/make_brand_assets.py --fonts <folder> --png      # also the PNG icons (needs Microsoft Edge)

Needs `fonttools` (pip install fonttools), only to run this script; the app only uses its output.
Poppins is free under the SIL Open Font License: https://fonts.google.com/specimen/Poppins

The P mark was measured on the 1050 x 330 PNG (pixel units): every stroke is 13.8 wide with square
ends and sharp corners, and the bowl of the P is one circle shared by the blue and the gold strokes.
The lettering is Poppins Medium ("PRAMAAN") and Poppins Regular (the tagline), placed letter by letter
where the PNG has them, then turned into outlines so the logo needs no font to display.

Writes:
  frontend/src/components/ui/BrandLogo.paths.ts   path data for <BrandLogo> (follows the app's theme)
  frontend/public/favicon.svg                       the P mark
  docs/brand/pramaan-mark.svg                       the P mark
  docs/brand/pramaan-logo-light.svg, -dark.svg      full logo for light and dark backgrounds
  with --png: frontend/public/favicon.ico, apple-touch-icon.png, og-image.png
"""

import argparse
import math
import subprocess
import tempfile
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]

# Colours sampled from the PNG; INK and MUTED are the app's own text colours (styles/tokens.css).
BLUE, GOLD = "#2C87E8", "#D8A03F"
CREAM, GREY = "#FBF4E4", "#8E8E8E"
INK, MUTED, PAPER = "#1F3354", "#5B6B82", "#F8F6F1"

# The P mark
# Straight parts were measured along the middle of each stroke; the two curves of the bowl are cubic
# Béziers fitted to it (within 0.4 px). The check mark cuts the bowl: the blue curve ends on a line
# almost parallel to the check, and the gold curve starts on a near-square cut. Each curve runs a
# little past its cut and is clipped there, which gives the angled ends.
STROKE = 13.8
MARK_BLUE = [
    # stem, top bar, top of the bowl (runs on past the cut)
    "M58.6 173.9V64.7H156.9C179.39 64.7 184.44 69.69 202.68 82.39l3.28 2.29",
    "M178.5 102.6H94.5V160.6L58.6 197.2V277.5",  # inner bar, step down, long stem
]
MARK_GOLD = [
    "M114.68 144.6L142.2 171.6L243.64 65.45",  # the check mark
    # rest of the bowl (starting before the cut), bottom bar, foot
    "M225.77 108.04L227.07 111.82C237.92 143.42 222.94 208.5 160.56 208.5H93.6V270H66.6",
]
# The cuts: a point on the line, its angle (degrees, rising to the right), and a point on the side to keep.
CUTS = {"blue": ((202.68, 82.39), 43.4, (158.0, 64.7)), "gold": ((227.07, 111.82), 12.3, (160.0, 208.5))}
MARK_BOX = (51.7, 57.8, 248.6, 277.5)  # left, top, right, bottom, strokes included


def keep_side(cut: tuple, box: tuple = (-100.0, -100.0, 1200.0, 500.0)) -> str:
    """A polygon for one side of a cut line (a big box clipped by the line), as SVG path data."""
    (px, py), degrees, (kx, ky) = cut
    dx, dy = math.cos(math.radians(degrees)), -math.sin(math.radians(degrees))
    side = lambda x, y: (x - px) * dy - (y - py) * dx  # noqa: E731  sign tells the side of the line
    keep = math.copysign(1, side(kx, ky))
    left, top, right, bottom = box
    corners = [(left, top), (right, top), (right, bottom), (left, bottom)]
    out = []
    for (x1, y1), (x2, y2) in zip(corners, corners[1:] + corners[:1]):
        s1, s2 = side(x1, y1) * keep, side(x2, y2) * keep
        if s1 >= 0:
            out.append((x1, y1))
        if s1 * s2 < 0:
            t = s1 / (s1 - s2)
            out.append((x1 + t * (x2 - x1), y1 + t * (y2 - y1)))
    return "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in out) + "Z"


CLIPS = {name: keep_side(cut) for name, cut in CUTS.items()}

# The lettering
# (text, font file, font size, baseline, left edge of each letter's ink), all from the PNG.
WORDMARK = ("PRAMAAN", "Poppins-Medium.ttf", 119.8, 177.0,
            [303.0, 385.2, 467.1, 566.2, 678.1, 772.6, 871.7])
TAGLINE = ("TRUST&VERIFICATION", "Poppins-Regular.ttf", 46.2, 243.0,
           [298.6, 334.0, 370.3, 409.4, 443.7, 498.0, 561.0, 602.7, 634.8,
            671.4, 691.0, 722.7, 741.0, 784.6, 824.1, 859.5, 877.8, 924.0])
LOGO_BOX = (MARK_BOX[0], MARK_BOX[1], 949.6, MARK_BOX[3])


def outline(fonts: Path, spec: tuple) -> str:
    """One SVG path for a line of text: each glyph's outline, scaled and placed like the PNG."""
    text, font_file, size, baseline, lefts = spec
    font = TTFont(fonts / font_file)
    glyphs, cmap, glyf = font.getGlyphSet(), font.getBestCmap(), font["glyf"]
    scale = size / font["head"].unitsPerEm
    pen = SVGPathPen(glyphs, ntos=lambda n: f"{n:.2f}".rstrip("0").rstrip("."))
    for char, left in zip(text, lefts, strict=True):
        name = cmap[ord(char)]
        x = left - glyf[name].xMin * scale
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
    return pen.getCommands()


def view_box(box: tuple, pad: float = 1.0, square: bool = False) -> str:
    left, top, right, bottom = box
    width, height = right - left, bottom - top
    if square:
        side = max(width, height)
        left, top = left - (side - width) / 2, top - (side - height) / 2
        width = height = side
    return f"{left - pad:.1f} {top - pad:.1f} {width + 2 * pad:.1f} {height + 2 * pad:.1f}"


def mark_svg_body() -> str:
    clips = "".join(f'<clipPath id="pramaan-cut-{name}"><path d="{d}"/></clipPath>' for name, d in CLIPS.items())
    paths = [
        f'<path stroke="{BLUE}" d="{MARK_BLUE[0]}" clip-path="url(#pramaan-cut-blue)"/>',
        f'<path stroke="{BLUE}" d="{MARK_BLUE[1]}"/>',
        f'<path stroke="{GOLD}" d="{MARK_GOLD[0]}"/>',
        f'<path stroke="{GOLD}" d="{MARK_GOLD[1]}" clip-path="url(#pramaan-cut-gold)"/>',
    ]
    return (f"<defs>{clips}</defs><g fill=\"none\" stroke-width=\"{STROKE}\" stroke-linejoin=\"miter\" "
            f"stroke-linecap=\"butt\">{''.join(paths)}</g>")


def svg(box: str, body: str, title: str = "Pramaan") -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-label="{title}">'
            f"<title>{title}</title>{body}</svg>\n")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    print("wrote", path.relative_to(ROOT))


def make_vectors(fonts: Path) -> dict[str, str]:
    word, tag = outline(fonts, WORDMARK), outline(fonts, TAGLINE)
    mark_box, logo_box = view_box(MARK_BOX, pad=4, square=True), view_box(LOGO_BOX)
    mark = svg(mark_box, mark_svg_body())
    write(ROOT / "frontend/public/favicon.svg", mark)
    write(ROOT / "docs/brand/pramaan-mark.svg", mark)
    for theme, (word_colour, tag_colour) in {"light": (INK, MUTED), "dark": (CREAM, GREY)}.items():
        body = mark_svg_body() + f'<path fill="{word_colour}" d="{word}"/><path fill="{tag_colour}" d="{tag}"/>'
        write(ROOT / f"docs/brand/pramaan-logo-{theme}.svg", svg(logo_box, body))
    ts = [
        "// Generated by tools/make_brand_assets.py from the team's logo PNG. Don't edit by hand.",
        f'export const LOGO_VIEW_BOX = "{logo_box}";',
        f'export const MARK_VIEW_BOX = "{mark_box}";',
        f"export const MARK_STROKE_WIDTH = {STROKE};",
        "/** The first blue and the second gold path are clipped by the cut on their side of the check mark. */",
        f"export const MARK_BLUE = {MARK_BLUE!r} as const;".replace("'", '"'),
        f"export const MARK_GOLD = {MARK_GOLD!r} as const;".replace("'", '"'),
        f'export const CUT_BLUE = "{CLIPS["blue"]}";',
        f'export const CUT_GOLD = "{CLIPS["gold"]}";',
        f'export const WORDMARK = "{word}";',
        f'export const TAGLINE = "{tag}";',
    ]
    write(ROOT / "frontend/src/components/ui/BrandLogo.paths.ts", "\n".join(ts) + "\n")
    return {"mark": mark, "light": (ROOT / "docs/brand/pramaan-logo-light.svg").read_text(encoding="utf-8")}


EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")


def screenshot(html: str, width: int, height: int, out: Path) -> None:
    """Render a page with headless Edge: browsers draw SVG exactly as the app will."""
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "page.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        "--force-device-scale-factor=1", "--default-background-color=00000000",
                        f"--window-size={width},{height}", f"--screenshot={out}", page.as_uri()],
                       check=True, capture_output=True, timeout=60)


def page(svg_text: str, width: int, height: int, background: str, svg_width: float) -> str:
    return (f"<!doctype html><html><body style='margin:0;width:{width}px;height:{height}px;display:grid;"
            f"place-items:center;background:{background}'><div style='width:{svg_width}px'>"
            f"{svg_text.replace('<svg ', '<svg style=\"display:block;width:100%;height:auto\" ', 1)}</div></body></html>")


def make_pngs(vectors: dict[str, str]) -> None:
    from PIL import Image  # Pillow is already a backend dependency

    public = ROOT / "frontend/public"
    with tempfile.TemporaryDirectory() as tmp:
        big = Path(tmp) / "mark.png"
        screenshot(page(vectors["mark"], 256, 256, "transparent", 256), 256, 256, big)
        Image.open(big).save(public / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
        print("wrote frontend/public/favicon.ico")
    screenshot(page(vectors["mark"], 180, 180, PAPER, 136), 180, 180, public / "apple-touch-icon.png")
    print("wrote frontend/public/apple-touch-icon.png")
    screenshot(page(vectors["light"], 1200, 630, PAPER, 860), 1200, 630, public / "og-image.png")
    print("wrote frontend/public/og-image.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--fonts", type=Path, required=True, help="folder with the Poppins .ttf files")
    parser.add_argument("--png", action="store_true", help="also render the PNG icons with Microsoft Edge")
    args = parser.parse_args()
    made = make_vectors(args.fonts)
    if args.png:
        make_pngs(made)
