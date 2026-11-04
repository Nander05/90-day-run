"""Maakt de app-iconen uit het logo van de WhatsApp-groep (tools/pwa/logo.png). Gebruik: python3 tools/make_icons.py"""
import os, pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageStat
root = pathlib.Path(__file__).resolve().parent / "pwa"
out = root / "icons"; out.mkdir(exist_ok=True)
logo = Image.open(root / "logo.png").convert("RGB")
# gemiddelde kleur van de buitenrand van het logo = achtergrond (het logo heeft fijne korrel, dus niet één pixel)
ring = Image.new("L", logo.size, 0); d = ImageDraw.Draw(ring); d.rectangle((0, 0, 639, 639), fill=255); d.rectangle((24, 24, 615, 615), fill=0)
bg = tuple(int(round(v)) for v in ImageStat.Stat(logo, ring).mean)

def plain(size): return logo.resize((size, size), Image.LANCZOS)

def maskable(size, scale=0.72):     # logo in het midden: veilig voor ronde en afgeronde uitsnedes
    c = Image.new("RGB", (size, size), bg); s = int(size * scale)
    m = Image.new("L", (s, s), 0); f = max(2, s // 14)       # zachte rand, geen zichtbare naad
    ImageDraw.Draw(m).rectangle((f, f, s - f, s - f), fill=255); m = m.filter(ImageFilter.GaussianBlur(f / 2))
    c.paste(logo.resize((s, s), Image.LANCZOS), ((size - s) // 2, (size - s) // 2), m); return c

plain(192).save(out / "icon-192.png"); plain(512).save(out / "icon-512.png")
maskable(512).save(out / "icon-maskable-512.png")
maskable(180, 0.86).save(out / "apple-touch-icon.png")   # iOS rondt zelf af
plain(32).save(out / "favicon-32.png")
print(sorted(os.listdir(out)))
