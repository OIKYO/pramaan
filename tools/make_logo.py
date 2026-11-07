"""Draw the fictional Northfield Academy logo (backend/assets/northfield-logo.png).

    backend\\.venv\\Scripts\\python tools\\make_logo.py

The same file is uploaded as the brand kit logo (scripts/seed.py), stamped onto the test posters
(tools/make_test_posters.py) and used as the template for the logo check (BRAND-01).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "backend" / "assets" / "northfield-logo.png"
NAVY, CREAM, GOLD = "#1F3354", "#F8F6F1", "#E0A526"


def draw_logo(size: int = 240) -> Image.Image:
    img = Image.new("RGB", (size, size), CREAM)
    d = ImageDraw.Draw(img)
    pad = size // 12
    d.rounded_rectangle((pad, pad, size - pad, size - pad), radius=size // 6, fill=NAVY)
    # A gold "north" chevron above a bold white N: distinctive shapes help template matching.
    cx = size // 2
    d.polygon([(cx, size * 0.17), (cx + size * 0.13, size * 0.33), (cx - size * 0.13, size * 0.33)], fill=GOLD)
    font = ImageFont.load_default(size=int(size * 0.5))
    d.text((cx, size * 0.63), "N", font=font, fill=CREAM, anchor="mm", stroke_width=size // 60, stroke_fill=CREAM)
    return img


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    draw_logo().save(OUT)
    print(f"wrote {OUT}")
