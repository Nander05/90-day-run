import os, sys
from playwright.sync_api import sync_playwright, expect
B = "http://localhost:8765"
O = sys.argv[1]
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome") if os.path.exists("/usr/bin/google-chrome") else p.chromium.launch()
    def new(w=1100, h=820):
        c = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        return c.new_page()
    a = new(); a.goto(B); a.wait_for_selector("#loginform")
    a.screenshot(path=f"{O}/1-login.png")
    a.fill("#li-email", "nander@example.com"); a.fill("#li-pw", "admin-wachtwoord-123"); a.click("#loginform button")
    a.wait_for_selector("#nav a")
    a.goto(B + "/#beheer"); a.wait_for_selector("#addform")
    links = []
    for n, e in [("Anna de Vries", "anna@example.com"), ("Ben Peeters", "ben@example.com"), ("Carla Janssens", "carla@example.com")]:
        a.fill("#ad-name", n); a.fill("#ad-email", e); a.click("#addform button")
        a.wait_for_selector("#invurl"); links.append(a.input_value("#invurl"))
        expect(a.locator("main")).to_contain_text(e)
    # Anna: account, doel en een paar dagen
    an = new(); an.goto(links[0]); an.reload(); an.wait_for_selector("#inviteform")
    an.screenshot(path=f"{O}/2-uitnodiging.png")
    an.fill("#iv-pw", "anna-geheim-12345"); an.fill("#iv-rep", "anna-geheim-12345"); an.click("#inviteform button")
    an.wait_for_selector("#nav a")
    an.goto(B + "/#mijn-90"); an.wait_for_selector("textarea[data-k]")
    an.locator("textarea[data-k]").first.fill("Elke week drie echte gesprekken voeren, zonder te duwen.")
    expect(an.locator("#sv")).to_have_text("Opgeslagen", timeout=8000)
    an.goto(B + "/#week-1"); an.wait_for_selector("[data-day]")
    for i in range(3):
        an.locator("[data-day]").nth(i).click()
    expect(an.locator("#sv")).to_have_text("Opgeslagen", timeout=8000)
    an.goto(B + "/#start"); an.wait_for_selector("#nav a"); an.wait_for_timeout(400)
    an.screenshot(path=f"{O}/3-deelnemer-vandaag.png")
    an.goto(B + "/#week-1"); an.wait_for_selector("[data-day]"); an.wait_for_timeout(400)
    an.screenshot(path=f"{O}/4-deelnemer-week1.png")
    # beheerder
    a.click("[data-act=refresh]"); expect(a.locator("main")).to_contain_text("Elke week drie echte gesprekken", timeout=8000)
    a.wait_for_timeout(300)
    a.screenshot(path=f"{O}/5-beheerder-overzicht.png", full_page=True)
    aid = a.evaluate("fetch('/api/admin/participants').then(r=>r.json()).then(j=>j.participants.find(p=>p.name.startsWith('Anna')).id)")
    a.goto(B + f"/#deelnemer-{aid}-week-1"); a.wait_for_selector(".viewas"); a.wait_for_timeout(400)
    a.screenshot(path=f"{O}/6-beheerder-ziet-anna.png")
    m = new(390, 800); m.goto(B); m.wait_for_selector("#loginform")
    m.fill("#li-email", "nander@example.com"); m.fill("#li-pw", "admin-wachtwoord-123"); m.click("#loginform button")
    m.wait_for_selector("#nav a"); m.goto(B + "/#beheer"); m.wait_for_selector(".pcard"); m.wait_for_timeout(400)
    m.screenshot(path=f"{O}/7-mobiel-beheer.png")
    br.close()
