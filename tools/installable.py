"""Vraagt Chrome (via DevTools) of de app installeerbaar is. Verwacht een draaiende server op :8765."""
import os, json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome") if os.path.exists("/usr/bin/google-chrome") else p.chromium.launch()
    pg = br.new_page()
    pg.goto("http://localhost:8765/"); pg.wait_for_selector("#loginform"); pg.wait_for_timeout(1500)
    c = pg.context.new_cdp_session(pg)
    c.send("Page.enable")
    err = c.send("Page.getInstallabilityErrors")
    man = c.send("Page.getAppManifest")
    print("installeerbaarheidsfouten:", json.dumps(err.get("installabilityErrors")) or "geen")
    print("manifest-fouten:", [e["message"] for e in man.get("errors", [])] or "geen")
    print("manifest-url:", man.get("url"))
    br.close()
