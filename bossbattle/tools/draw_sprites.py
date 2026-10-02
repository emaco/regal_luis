"""Dibuja los sprites hechos a mano (mapas ASCII) y los guarda como PNG.

Uso:  python tools/draw_sprites.py
Salida: assets/sprites/*.png  (y una hoja de contacto en tools/preview-sprites.png)

Cada letra es un color de la paleta Endesga 32; el punto es transparente.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "sprites"

PAL = {
    "K": "181425", "k": "262b44", "D": "3a4466", "G": "5a6988", "g": "8b9bb4",
    "L": "c0cbdc", "W": "ffffff", "O": "f77622", "Y": "feae34", "y": "fee761",
    "R": "e43b44", "r": "a22633", "B": "733e39", "b": "b86f50", "T": "e4a672",
    "t": "ead4aa", "E": "63c74d", "e": "3e8948", "n": "265c42", "U": "0099db",
    "u": "124e89", "C": "2ce8f5", "P": "b55088", "p": "68386c", "M": "f6757a",
    "S": "e8b796", "s": "c28569", "A": "be4a2f",
}

SPRITES = {
    # Kira, border collie, vista frontal corriendo hacia la cámara (24x24)
    "kira": """
........................
...KK..............KK...
..KKKK............KKKK..
..KKKKK..........KKKKK..
..KKKKKKKKKKKKKKKKKKKK..
...KKKKKKKKKKKKKKKKKK...
...KKKKKKKWWWWKKKKKKK...
...KKKKKKWWWWWWKKKKKK...
...KKKWWKWWWWWWKWWKKK...
...KKKWKWWWWWWWWKWKKK...
...KKKKWWWWWWWWWWKKKK...
....KKKWWWWKKWWWWKKK....
....KKKWWWWKKWWWWKKK....
.....KKWWWMMMMWWWKK.....
......KWWWWMMWWWWK......
.......WWWWWWWWWW.......
......KKWWWWWWWWKK......
.....KKKWWWWWWWWKKK.....
....KKKKWWWWWWWWKKKK....
....KKKWWW....WWWKKK....
....WWWWW......WWWWW....
....WWWW........WWWW....
....KKKK........KKKK....
........................
""",
    # Cucaracha del parque, vista lateral (24x12)
    "cucaracha": """
........................
....B..............B....
.....B............B.....
......BBBBBBBBBBBB......
....BBbbbbbbbbbbbbBB....
...BBbbbbbbbbbbbbbbBB...
..KBbbbbbbbbbbbbbbbbBK..
..KBBBBBBBBBBBBBBBBBBK..
...BBB..BB..BB..BBB.....
....B..B..B..B..B..B....
...B...B..B..B..B...B...
........................
""",
    # Enchufe de pared (12x12)
    "enchufe": """
.LLLLLLLLLL.
LLWWWWWWWWLL
LWWWWWWWWWWL
LWWWWWWWWWWL
LWWKKWWWWKKL
LWWKKWWWWKKL
LWWWWWWWWWWL
LWWWWWWWWWWL
LWWWWWWWWWWL
LWWWWWWWWWWL
LLWWWWWWWWLL
.LLLLLLLLLL.
""",
    # Rayo / chispazo (8x12)
    "rayo": """
....yy..
...yyy..
..yyy...
.yyyyyy.
..yyyy..
...yyy..
..yyy...
.yyy....
.yy.....
yy......
y.......
........
""",
    # Porción de pizza Bianca (14x12)
    "bianca": """
......ss......
.....sttss....
....sttWtts...
....stttttts..
...sttWttttts.
...stttttWtts.
..sttttttttts.
..stWtttttWts.
.sttttttttttts
.sBBBBBBBBBBBs
.sbbbbbbbbbbbs
..ssssssssss..
""",
    # Lata de Coca-Cola (zero) (8x14)
    "cola": """
.gLLLLg.
gLLLLLLg
KKKKKKKK
KKKKKKKK
KKRRRRKK
KKRWWRKK
KKRRRRKK
KKKKKKKK
KKWWWWKK
KKKKKKKK
KKKKKKKK
KKKKKKKK
gKKKKKKg
.gggggg.
""",
    # Botella de agua (8x16)
    "agua": """
...UU...
...UU...
..LLLL..
..CCCC..
.CCCCCC.
.CCCWCC.
.CCCWCC.
.CCCCCC.
.CCCCCC.
.CUUUUC.
.CUWWUC.
.CUUUUC.
.CCCCCC.
.CCCCCC.
.CCCCCC.
..CCCC..
""",
    # Lata de Coca-Cola normal, el espejismo (8x14)
    "cola_falsa": """
.gLLLLg.
gLLLLLLg
RRRRRRRR
RRRRRRRR
RRWWWWRR
RRWRRWRR
RRWWWWRR
RRRRRRRR
RRRRRRRR
RRRRRRRR
RRRRRRRR
RRRRRRRR
gRRRRRRg
.gggggg.
""",
    # Patata (12x9)
    "patata": """
............
....TTTT....
..TTTbTTTT..
.TTTTTTTbTT.
.TbTTTTTTTT.
.TTTTTbTTTT.
..TTTTTTTT..
...TTbTTT...
............
""",
    # Cuchillo (16x6)
    "cuchillo": """
................
LLLLLLLLLL......
gLLLLLLLLLLBBBB.
ggggggggggLBBBBB
.gggggggggBBBBB.
................
""",
    # Meteorito (12x12)
    "meteorito": """
.....y......
....yYY.....
...yYOOY....
..yYOOOOY...
..YOORROOy..
.yOORRRROY..
.yORRRRROY..
..YORRRROy..
..yOOORROY..
...YOOOOy...
....YYyy....
............
""",
    # Escudo con pincho (12x14)
    "escudo": """
.gggggggggg.
gLLLLLLLLLLg
gLLLLLLLLLLg
gLLLLggLLLLg
gLLLgLLgLLLg
gLLgLLLLgLLg
gLLLgLLgLLLg
gLLLLggLLLLg
.gLLLLLLLLg.
.gLLLLLLLLg.
..gLLLLLLg..
...gLLLLg...
....gLLg....
.....gg.....
""",
    # Pata de carnero (14x10)
    "carnero": """
..............
.....bbbb.....
...bbBBBBbb...
..bBBBBBBBBb..
..bBBBtBBBBb..
..bBBBBBBBBb..
...bbBBBBbb...
.....bbbb.....
.....LLLL.....
......LL......
""",
    # Corazón (8x7)
    "corazon": """
.RR..RR.
RRRRRRRR
RMRRRRRR
RRRRRRRR
.RRRRRR.
..RRRR..
...RR...
""",
    # Cursor / flecha de diálogo (7x4)
    "flecha": """
KKKKKKK
.KKKKK.
..KKK..
...K...
""",
    # Cartel del Masymas (48x16)
    "masymas": """
................................................
.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.
RRyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyRR
RRyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyRR
RRyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyRR
RRyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyRR
RRyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyRR
RRyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyRR
RRyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyRR
.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.
....KK..................................KK......
....KK..................................KK......
....KK..................................KK......
....KK..................................KK......
....KK..................................KK......
................................................
""",
    # Puerta / entrada del Masymas (20x24)
    "puerta": """
gggggggggggggggggggg
gLLLLLLLLLLLLLLLLLLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLLLLLLLLLLLLLLLLLLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCyCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLCCCCCCCCCCCCCCCCLg
gLLLLLLLLLLLLLLLLLLg
gggggggggggggggggggg
gggggggggggggggggggg
""",
}


def hex_to_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def draw(name, ascii_map):
    rows = [r for r in ascii_map.strip("\n").split("\n")]
    w = max(len(r) for r in rows)
    h = len(rows)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == "." or ch == " ":
                continue
            if ch not in PAL:
                raise SystemExit(f"{name}: carácter desconocido {ch!r} en fila {y}")
            px[x, y] = hex_to_rgb(PAL[ch]) + (255,)
    img.save(OUT / f"{name}.png")
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    imgs = {n: draw(n, m) for n, m in SPRITES.items()}
    scale = 4
    pad = 8
    cols = 4
    cw = max(i.width for i in imgs.values()) * scale + pad
    ch = max(i.height for i in imgs.values()) * scale + pad
    rows = (len(imgs) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cw, rows * ch), (90, 105, 136, 255))
    for i, (n, im) in enumerate(imgs.items()):
        big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        sheet.alpha_composite(big, ((i % cols) * cw + pad // 2, (i // cols) * ch + pad // 2))
    sheet.save(ROOT / "tools" / "preview-sprites.png")
    print(f"{len(imgs)} sprites en {OUT}")


if __name__ == "__main__":
    main()
