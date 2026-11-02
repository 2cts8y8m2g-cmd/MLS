"""Generate a Tesla Model Y (2020-2024) Toybox custom wrap (1024x1024 PNG) with the FitRise logo.

Usage:  python3 wraps/fitrise/generate.py
Reads logo.png (FitRise logo on a white background) and template.png
(the panel layout), writes FitRise.png and preview_with_outlines.png.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageOps

HERE = Path(__file__).parent
SIZE = 1024
BODY = (246, 247, 249)       # gloss white
BLUE = (0, 70, 158)          # FitRise blue, sampled from the logo
BLACK = (14, 14, 16)


def knock_out_white(img: Image.Image) -> Image.Image:
    """Turn the white background transparent, keeping anti-aliased edges clean."""
    a = np.asarray(img.convert("RGB")).astype(float)
    alpha = 255 - a.min(axis=2)
    alpha[alpha < 12] = 0
    k = np.where(alpha > 0, 255 / np.maximum(alpha, 1), 0)[..., None]
    rgb = np.clip(255 - (255 - a) * k, 0, 255)
    return Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), "RGBA")


def logo_parts():
    """Split the logo into emblem / wordmark / tagline by the blank rows between them."""
    logo = knock_out_white(Image.open(HERE / "logo.png"))
    ink = np.asarray(logo)[..., 3].max(axis=1) > 0
    rows = np.flatnonzero(ink)
    bands, start = [], rows[0]
    for prev, cur in zip(rows, rows[1:]):
        if cur - prev > 5:
            bands.append((start, prev + 1))
            start = cur
    bands.append((start, rows[-1] + 1))
    parts = []
    for top, bot in bands:
        band = logo.crop((0, top, logo.width, bot))
        parts.append(band.crop(band.getbbox()))
    return parts  # [emblem, wordmark, tagline]


def template_lines() -> Image.Image:
    """Panel outlines as a 0/255 mask (template has a transparent background)."""
    raw = Image.open(HERE / "template.png").convert("RGBA")
    flat = Image.new("RGBA", raw.size, (255, 255, 255, 255))
    flat.alpha_composite(raw)
    return ImageOps.invert(flat.convert("L")).point(lambda v: 255 if v > 80 else 0)


def not_painted_mask(lines: Image.Image) -> Image.Image:
    """255 where nothing gets wrapped: the glass roof and the space between panels."""
    m = lines.convert("RGB")
    for seed in ((2, 2), (512, 560)):            # outside area, glass roof
        ImageDraw.floodfill(m, seed, (255, 0, 0), thresh=10)
    a = np.asarray(m)
    return Image.fromarray(((a[..., 0] == 255) & (a[..., 1] == 0)).astype(np.uint8) * 255)


def fit(img, width=None, height=None):
    s = width / img.width if width else height / img.height
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)


def paste(canvas, img, cx, cy):
    canvas.alpha_composite(img, (round(cx - img.width / 2), round(cy - img.height / 2)))


def recolor_dark(img: Image.Image, color) -> Image.Image:
    """Swap the logo's black ink for another color (keeps blue and edges)."""
    a = np.asarray(img).copy()
    dark = a[..., :3].max(axis=2) < 90
    a[dark, :3] = color
    return Image.fromarray(a, "RGBA")


# Colorways: body color, center stripe color, the logo's "black" ink, plate ring
STYLES = {
    "FitRise": dict(body=(14, 14, 16), stripe=(245, 246, 248), ink=(255, 255, 255)),
    "FitRise_White": dict(body=(246, 247, 249), stripe=BLACK, ink=None),
}


def render(name, body, stripe, ink):
    emblem, wordmark, _tagline = logo_parts()
    if ink:
        emblem, wordmark = recolor_dark(emblem, ink), recolor_dark(wordmark, ink)
    c = Image.new("RGBA", (SIZE, SIZE), body + (255,))
    d = ImageDraw.Draw(c)

    # Panel map (Model Y, 2020-2024 template): front of the car is the top of
    # the image. Front bumper y~5-150, hood y~150-390, glass roof in the
    # middle (not wrapped), liftgate below it, rear bumper at the bottom.
    # Side panels: the roof edge faces the middle of the template.
    # Front bumper + hood are mapped upside down (their top edge, toward the
    # windshield, points down in the image), so front art is rotated 180.
    # Liftgate + rear bumper are upright as drawn.

    # Center stripes over front bumper / hood / liftgate / rear bumper
    d.rectangle([452, 0, 476, SIZE], fill=BLUE)
    d.rectangle([548, 0, 572, SIZE], fill=BLUE)
    d.rectangle([484, 0, 540, SIZE], fill=stripe)

    # Side panels: blue slash graphic sweeping toward the rear, echoing the logo
    for x0, x1, flip in ((20, 215, False), (810, 1004, True)):
        for y, h, col in [(610, 70, BLUE), (690, 22, stripe), (722, 10, BLUE)]:
            pts = [(x0, y + 60), (x1, y), (x1, y + h), (x0, y + h + 60)]
            if flip:
                pts = [(x0, y), (x1, y + 60), (x1, y + h + 60), (x0, y + h)]
            d.polygon(pts, fill=col)

    # Plates in the body color break the stripes so the logos sit on clean ground
    d.ellipse([512 - 102, 280 - 102, 512 + 102, 280 + 102], fill=body, outline=BLUE, width=6)
    d.rectangle([330, 40, 694, 108], fill=body)
    d.rectangle([395, 866, 629, 920], fill=body)

    # Emblem on the hood, wordmark on front bumper, liftgate and both sides
    paste(c, fit(emblem, width=172).rotate(180), 512, 280)
    paste(c, fit(wordmark, width=330).rotate(180), 512, 74)
    paste(c, fit(wordmark, width=210), 512, 893)
    side = fit(wordmark, width=320)
    # Letter tops toward the roof edge: left side reads front-to-rear,
    # right side reads rear-to-front (both read left-to-right from outside).
    paste(c, side.rotate(-90, expand=True), 112, 445)
    paste(c, side.rotate(90, expand=True), 912, 445)

    # Keep the design on the body panels only: blank out glass and gaps
    lines = template_lines()
    c.paste(body + (255,), mask=not_painted_mask(lines))

    out = c.convert("RGB")
    out.save(HERE / f"{name}.png", optimize=True)

    prev = out.copy()
    prev.paste((230, 0, 80), mask=lines)
    prev.save(HERE / f"preview_{name}.png")


def main():
    for name, style in STYLES.items():
        render(name, **style)


if __name__ == "__main__":
    main()
