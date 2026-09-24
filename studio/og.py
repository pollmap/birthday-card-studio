"""Render a 1200x630 Open Graph image for one validated card config."""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "docs" / "assets"
CONFIG = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
OUT = Path(sys.argv[2])
PEACH = CONFIG["theme"] == "peach"
W, H = 1200, 630

background = (232, 183, 181) if PEACH else (239, 189, 67)
paper = (255, 249, 246) if PEACH else (255, 250, 232)
ink = (79, 47, 60) if PEACH else (57, 36, 20)
accent = (151, 82, 113) if PEACH else (179, 99, 16)
border = (204, 160, 176) if PEACH else (215, 174, 88)

canvas = Image.new("RGBA", (W, H), background + (255,))
d = ImageDraw.Draw(canvas)
for y in range(H):
    t = y / H
    if PEACH:
        color = (int(244 - 8 * t), int(210 - 21 * t), int(208 - 9 * t), 255)
    else:
        color = (int(255 - 10 * t), int(240 - 18 * t), int(189 - 38 * t), 255)
    d.line((0, y, W, y), fill=color)

shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle((32, 35, W - 12, H - 9), radius=35, fill=ink + (48,))
canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(18)))
canvas.alpha_composite(Image.new("RGBA", (W - 44, H - 44), paper + (255,)), (22, 22))
d = ImageDraw.Draw(canvas)
d.rounded_rectangle((35, 35, W - 35, H - 35), radius=25, outline=border + (170,), width=2)

glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((700, 80, 1180, 610), fill=((238, 189, 212, 105) if PEACH else (255, 195, 73, 95)))
canvas = Image.alpha_composite(canvas, glow.filter(ImageFilter.GaussianBlur(52)))


def place(filename, size, x, y):
    global canvas
    img = Image.open(ASSETS / filename).convert("RGBA")
    img.thumbnail((size, size), Image.Resampling.LANCZOS)
    shade = Image.new("RGBA", img.size, (87, 52, 14, 0))
    shade.putalpha(img.getchannel("A").filter(ImageFilter.GaussianBlur(9)).point(lambda a: int(a * .18)))
    canvas.alpha_composite(shade, (x + 5, y + 11))
    canvas.alpha_composite(img, (x, y))


left = CONFIG["leftCharacter"]
right = CONFIG["rightCharacter"]
place(f"characters/{left}.png", 230 if left == "pichu" else 270, 685, 205)
place(f"characters/{right}.png", 230 if right == "pichu" else 270, 940, 205)
place("cake.png", 325 if PEACH else 345, 800, 270 if PEACH else 255)

font_path = Path("C:/Windows/Fonts/malgunbd.ttf")
if not font_path.exists():
    font_path = Path("C:/Windows/Fonts/malgun.ttf")
if not font_path.exists():
    font_path = Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc")

d = ImageDraw.Draw(canvas)


def fitted_font(text, start, max_width):
    for size in range(start, 37, -2):
        font = ImageFont.truetype(str(font_path), size)
        if d.textbbox((0, 0), text, font=font)[2] <= max_width:
            return font
    return ImageFont.truetype(str(font_path), 38)


d.text((79, 152), CONFIG["salutation"], font=fitted_font(CONFIG["salutation"], 80, 550), fill=ink + (255,))
d.text((79, 270), CONFIG["message"], font=fitted_font(CONFIG["message"], 64, 550), fill=accent + (255,))
d.line((80, 397, 605, 397), fill=border + (230,), width=2)
signature = "".join(ch for ch in CONFIG["signature"] if ord(ch) < 0x10000 and ch not in "\u200d\ufe0f♂")
d.text((81, 423), signature.strip(), font=ImageFont.truetype(str(font_path), 29), fill=ink + (220,))

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.convert("RGB").save(OUT, optimize=True)
print(OUT)
