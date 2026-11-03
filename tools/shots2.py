import os, sys
from playwright.sync_api import sync_playwright, expect
B = "http://localhost:8765"
O = sys.argv[1]
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome") if os.path.exists("/usr/bin/google-chrome") else p.chromium.launch()
    def new(w=1100, h=820):
        return br.new_context(viewport={"width": w, "height": h}).new_page()
    errs = []
    a = new(); a.on("pageerror", lambda e: errs.append(str(e)))
    a.goto(B); a.wait_for_selector("#loginform")
    a.screenshot(path=f"{O}/login-donker.png")
    a.fill("#li-email", "nander@example.com"); a.fill("#li-pw", "admin-wachtwoord-123"); a.click("#loginform button")
    a.wait_for_selector("#nav a"); a.goto(B + "/#beheer"); a.wait_for_selector("#addform")
    a.fill("#ad-name", "Anna de Vries"); a.fill("#ad-email", "anna@example.com"); a.click("#addform button")
    a.wait_for_selector("#invurl"); link = a.input_value("#invurl")
    an = new(); an.on("pageerror", lambda e: errs.append(str(e)))
    an.goto(link); an.reload(); an.wait_for_selector("#inviteform")
    an.fill("#iv-pw", "anna-geheim-12345"); an.fill("#iv-rep", "anna-geheim-12345"); an.click("#inviteform button")
    an.wait_for_selector("#nav a"); an.goto(B + "/#mijn-90"); an.wait_for_selector("textarea[data-k]")
    an.locator("textarea[data-k]").first.fill("Elke week drie echte gesprekken voeren, zonder te duwen.")
    expect(an.locator("#sv")).to_have_text("Opgeslagen", timeout=8000)
    an.goto(B + "/#week-1"); an.wait_for_selector("[data-day]")
    for i in range(3): an.locator("[data-day]").nth(i).click()
    expect(an.locator("#sv")).to_have_text("Opgeslagen", timeout=8000)
    for t in ["dark", "light", "red"]:
        an.click(f"[data-theme-set={t}]")
        an.goto(B + "/#start"); an.wait_for_selector("#nav a"); an.wait_for_timeout(500)
        an.screenshot(path=f"{O}/{t}-1-vandaag.png")
        an.goto(B + "/#week-1"); an.wait_for_selector("[data-day]"); an.wait_for_timeout(400)
        an.screenshot(path=f"{O}/{t}-2-week1.png")
        an.evaluate("window.scrollTo(0, 1500)"); an.wait_for_timeout(300)
        an.screenshot(path=f"{O}/{t}-3-week1-onder.png")
        a.click(f"[data-theme-set={t}]")
        a.goto(B + "/#beheer"); a.click("[data-act=refresh]") if a.locator("[data-act=refresh]").count() else None
        a.wait_for_selector(".pcard"); a.wait_for_timeout(400)
        a.screenshot(path=f"{O}/{t}-4-beheer.png")
    # onthoudt de keuze na herladen?
    an.reload(); an.wait_for_selector("#nav a")
    print("thema na herladen:", an.evaluate("document.documentElement.getAttribute('data-theme')"))
    m = new(390, 800); m.on("pageerror", lambda e: errs.append(str(e)))
    m.goto(B); m.wait_for_selector("#loginform"); m.click("[data-theme-set=red]"); m.wait_for_timeout(300)
    m.screenshot(path=f"{O}/red-5-mobiel-login.png")
    print("JS-fouten:", errs or "geen")
    br.close()
