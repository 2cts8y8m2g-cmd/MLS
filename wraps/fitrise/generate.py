"""Generate a Tesla Toybox custom wrap (1024x1024 PNG) with the FitRise logo.

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


def fit(img, width=None, height=None):
    s = width / img.width if width else height / img.height
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)


def paste(canvas, img, cx, cy):
    canvas.alpha_composite(img, (round(cx - img.width / 2), round(cy - img.height / 2)))


def main():
    emblem, wordmark, _tagline = logo_parts()
    c = Image.new("RGBA", (SIZE, SIZE), BODY + (255,))
    d = ImageDraw.Draw(c)

    # Center stripes over front bumper / hood / roof / trunk / rear bumper
    d.rectangle([452, 0, 476, SIZE], fill=BLUE)
    d.rectangle([548, 0, 572, SIZE], fill=BLUE)
    d.rectangle([484, 0, 540, SIZE], fill=BLACK)

    # Side panels: blue slash graphic sweeping toward the rear, echoing the logo
    for x0, x1, flip in ((20, 215, False), (810, 1004, True)):
        for i, (y, h, col) in enumerate([(610, 70, BLUE), (690, 22, BLACK), (722, 10, BLUE)]):
            pts = [(x0, y + 60), (x1, y), (x1, y + h), (x0, y + h + 60)]
            if flip:
                pts = [(x0, y), (x1, y + 60), (x1, y + h + 60), (x0, y + h)]
            d.polygon(pts, fill=col)

    # White plates break the stripes so the logos sit on clean ground
    d.ellipse([512 - 138, 560 - 138, 512 + 138, 560 + 138], fill=BODY, outline=BLUE, width=6)
    d.rectangle([330, 40, 694, 108], fill=BODY)
    d.rectangle([395, 866, 629, 920], fill=BODY)

    # Emblem on the roof/hood, wordmark on bumpers and both sides
    paste(c, fit(emblem, width=230), 512, 560)
    paste(c, fit(wordmark, width=330), 512, 74)
    paste(c, fit(wordmark, width=210), 512, 893)
    side = fit(wordmark, width=300)
    paste(c, side.rotate(90, expand=True), 118, 445)
    paste(c, side.rotate(-90, expand=True), 906, 445)

    out = c.convert("RGB")
    out.save(HERE / "FitRise.png", optimize=True)

    raw = Image.open(HERE / "template.png").convert("RGBA")
    flat = Image.new("RGBA", raw.size, (255, 255, 255, 255))
    flat.alpha_composite(raw)
    lines = ImageOps.invert(flat.convert("L")).point(lambda v: 255 if v > 80 else 0)
    prev = out.copy()
    prev.paste((230, 0, 80), mask=lines)
    prev.save(HERE / "preview_with_outlines.png")


if __name__ == "__main__":
    main()
