"""Maakt de app-iconen (PNG) uit tools/pwa/icon.html. Gebruik: python3 tools/make_icons.py"""
import os, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent
out = root / "pwa" / "icons"; out.mkdir(exist_ok=True)
sizes = {"icon-192.png": 192, "icon-512.png": 512, "icon-maskable-512.png": 512, "apple-touch-icon.png": 180, "favicon-32.png": 32}
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome") if os.path.exists("/usr/bin/google-chrome") else p.chromium.launch()
    for name, s in sizes.items():
        pg = br.new_page(viewport={"width": s, "height": s})
        pg.goto((root / "pwa" / "icon.html").as_uri()); pg.wait_for_timeout(400)
        pg.screenshot(path=str(out / name)); pg.close()
    br.close()
print(sorted(os.listdir(out)))
