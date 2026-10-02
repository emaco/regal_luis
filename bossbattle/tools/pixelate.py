"""Convierte las fotos del juego original en sprites y fondos pixel art.

Uso:
    python tools/pixelate.py [--cuts DIR]

Pipeline por sprite: recorte de fondo (rembg) -> reducción a N px (Lanczos) ->
cuantización a la paleta Endesga 32 sin dither -> PNG con transparencia.
Los fondos se reducen a 192x108 (la mitad del lienzo lógico de 384x216).

`--cuts DIR` reutiliza recortes ya hechos (`<nombre>-cut.png`) para no depender de
rembg, que necesita descargar un modelo de ~170 MB la primera vez:
    uv run --with "rembg[cpu]" --with pillow python tools/pixelate.py
"""
import argparse
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "game" / "assets" / "img"
OUT_SPRITES = ROOT / "assets" / "sprites"
OUT_BG = ROOT / "assets" / "bg"

E32 = [
    "be4a2f", "d77643", "ead4aa", "e4a672", "b86f50", "733e39", "3e2731", "a22633",
    "e43b44", "f77622", "feae34", "fee761", "63c74d", "3e8948", "265c42", "193c3e",
    "124e89", "0099db", "2ce8f5", "ffffff", "c0cbdc", "8b9bb4", "5a6988", "3a4466",
    "262b44", "181425", "ff0044", "68386c", "b55088", "f6757a", "e8b796", "c28569",
]
_pal = []
for h in E32:
    _pal += [int(h[i:i + 2], 16) for i in (0, 2, 4)]
_pal += [0] * (768 - len(_pal))
PALETTE_IMG = Image.new("P", (1, 1))
PALETTE_IMG.putpalette(_pal)

# nombre: (archivo, recorte en fracciones (l, t, r, b) o None, [anchos de salida])
SPRITES = {
    "pumpkin": ("pumpkin-cowboy.jpg", None, [56, 96]),
    "soul": ("soul.jpg", (0.33, 0.26, 0.75, 0.56), [28, 72]),
    "radahn": ("radahn.jpg", (0.2, 0.0, 0.8, 1.0), [80, 120]),
    "lion": ("white-lion.png", None, [64]),
}

# nombre: (archivo, recorte en fracciones o None, brillo)
BACKGROUNDS = {
    "fallout": ("fallout.jpg", None, 0.9),
    "radahn": ("radahn.jpg", None, 0.55),
    "mesa": ("soul.jpg", (0.0, 0.52, 1.0, 0.90), 0.8),
    "trascending": ("trascending.jpg", None, 0.9),
    "pumpkin": ("pumpkin-cowboy.jpg", None, 0.7),
}


def crop_frac(im, box):
    if not box:
        return im
    W, H = im.size
    l, t, r, b = box
    return im.crop((int(l * W), int(t * H), int(r * W), int(b * H)))


def quantize(rgb, contrast=1.15, saturation=1.25):
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    rgb = ImageEnhance.Color(rgb).enhance(saturation)
    return rgb.quantize(palette=PALETTE_IMG, dither=Image.NONE).convert("RGB")


def pixelate_sprite(cut, width):
    cut = cut.crop(cut.getbbox())
    h = max(1, round(cut.height * width / cut.width))
    small = cut.resize((width, h), Image.LANCZOS)
    rgb = quantize(small.convert("RGB"))
    alpha = small.split()[3].point(lambda v: 255 if v > 128 else 0)
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def pixelate_bg(im, brightness, size=(192, 108)):
    im = im.convert("RGB")
    # recorte centrado a 16:9
    W, H = im.size
    target = size[0] / size[1]
    if W / H > target:
        nw = int(H * target)
        im = im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))
    else:
        nh = int(W / target)
        im = im.crop((0, (H - nh) // 2, W, (H - nh) // 2 + nh))
    small = im.resize(size, Image.LANCZOS)
    small = ImageEnhance.Brightness(small).enhance(brightness)
    return quantize(small)


def get_cut(name, file, box, cuts_dir):
    if cuts_dir:
        p = Path(cuts_dir) / f"{name}-cut.png"
        if p.exists():
            return Image.open(p).convert("RGBA")
    from rembg import remove  # import tardío: solo si hace falta

    im = crop_frac(Image.open(SRC / file).convert("RGB"), box)
    cut = remove(im)
    if cuts_dir:
        Path(cuts_dir).mkdir(parents=True, exist_ok=True)
        cut.save(Path(cuts_dir) / f"{name}-cut.png")
    return cut


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cuts", help="carpeta con recortes <nombre>-cut.png (caché)")
    args = ap.parse_args()

    OUT_SPRITES.mkdir(parents=True, exist_ok=True)
    OUT_BG.mkdir(parents=True, exist_ok=True)

    for name, (file, box, widths) in SPRITES.items():
        cut = get_cut(name, file, box, args.cuts)
        for w in widths:
            out = pixelate_sprite(cut, w)
            out.save(OUT_SPRITES / f"{name}-{w}.png")
            print(f"sprite {name}-{w}.png {out.size}")

    for name, (file, box, brightness) in BACKGROUNDS.items():
        im = crop_frac(Image.open(SRC / file).convert("RGB"), box)
        out = pixelate_bg(im, brightness)
        out.save(OUT_BG / f"{name}.png")
        print(f"bg {name}.png {out.size}")


if __name__ == "__main__":
    main()
