"""Generate a Tesla Toybox custom wrap (1024x1024 PNG) with the FitRise logo.

Usage:  python3 wraps/fitrise/generate.py
Put your real logo at wraps/fitrise/logo.png (transparent PNG works best).
If it is missing, a placeholder "FITRISE" wordmark is drawn instead.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = Path(__file__).parent
SIZE = 1024
BASE = (12, 14, 18)          # near-black body
ACCENT = (255, 92, 0)        # FitRise orange
ACCENT2 = (255, 196, 0)      # gradient end
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"


def logo(width: int) -> Image.Image:
    p = HERE / "logo.png"
    if p.exists():
        img = Image.open(p).convert("RGBA")
    else:
        font = ImageFont.truetype(FONT, 200)
        box = font.getbbox("FITRISE")
        img = Image.new("RGBA", (box[2] + 40, box[3] + 40), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.text((20 - box[0], 20 - box[1]), "FIT", font=font, fill=(255, 255, 255))
        d.text((20 - box[0] + font.getlength("FIT"), 20 - box[1]), "RISE", font=font, fill=ACCENT)
    img = img.crop(img.getbbox())
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def paste(canvas, img, cx, cy):
    canvas.alpha_composite(img, (round(cx - img.width / 2), round(cy - img.height / 2)))


def main():
    c = Image.new("RGBA", (SIZE, SIZE), BASE + (255,))
    d = ImageDraw.Draw(c)

    # Diagonal speed stripes on the side panels (orange -> yellow gradient)
    stripes = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stripes)
    for i, y in enumerate(range(300, 780, 60)):
        t = i / 8
        col = tuple(round(a + (b - a) * t) for a, b in zip(ACCENT, ACCENT2)) + (255,)
        for x0, x1 in ((20, 215), (810, 1004)):
            sd.polygon([(x0, y + 40), (x1, y), (x1, y + 14), (x0, y + 54)], fill=col)
    c.alpha_composite(stripes)

    # Center racing stripes over bumper / hood / roof / trunk
    for off in (-70, 50):
        d.rectangle([512 + off, 0, 512 + off + 20, SIZE], fill=ACCENT + (255,))

    # Logos: hood/roof, front + rear bumper, both sides (rotated to run along the car)
    paste(c, logo(260), 512, 560)
    paste(c, logo(300), 512, 75)
    paste(c, logo(200), 512, 900)
    side = logo(380)
    paste(c, side.rotate(90, expand=True), 118, 525)
    paste(c, side.rotate(-90, expand=True), 906, 525)

    out = c.convert("RGB")
    out.save(HERE / "FitRise.png", optimize=True)

    # Preview with the panel outlines on top so you can check placement
    raw = Image.open(HERE / "template.png").convert("RGBA")
    flat = Image.new("RGBA", raw.size, (255, 255, 255, 255))
    flat.alpha_composite(raw)
    tpl = ImageOps.invert(flat.convert("L"))
    prev = out.copy()
    prev.paste((255, 255, 255), mask=tpl.point(lambda v: 255 if v > 80 else 0))
    prev.save(HERE / "preview_with_outlines.png")


if __name__ == "__main__":
    main()
