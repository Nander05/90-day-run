import os, sys
from playwright.sync_api import sync_playwright, expect
B = "http://localhost:8765"
errs = []


def ok(c, m):
    print(("OK   " if c else "FAIL ") + m)
    if not c:
        errs.append(m)


def saved(pg):
    expect(pg.locator("#sv")).to_have_text("Opgeslagen", timeout=8000)


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome") if os.path.exists("/usr/bin/google-chrome") else p.chromium.launch()

    def page(w=1100):
        ctx = br.new_context(viewport={"width": w, "height": 900})
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: (errs.append("JS: " + str(e)), print("JSERR", e)))
        return ctx, pg

    # ---------- beheerder
    actx, a = page()
    a.goto(B)
    a.wait_for_selector("#loginform")
    ok(a.locator("#nav a").count() == 0, "uitgelogd: geen menu zichtbaar")
    a.fill("#li-email", "nander@example.com")
    a.fill("#li-pw", "fout-wachtwoord-1")
    a.click("#loginform button")
    expect(a.locator("#lerr")).not_to_be_empty()
    ok(True, "fout wachtwoord geeft melding: " + a.inner_text("#lerr"))
    a.fill("#li-pw", "admin-wachtwoord-123")
    a.click("#loginform button")
    a.wait_for_selector("#nav a")
    ok("Deelnemers" in a.inner_text("#nav"), "admin ziet menu Deelnemers")
    a.goto(B + "/#beheer")
    a.wait_for_selector("#addform")
    links = []
    for n, e in [("Anna", "anna@example.com"), ("Ben", "ben@example.com")]:
        a.fill("#ad-name", n)
        a.fill("#ad-email", e)
        a.click("#addform button")
        a.wait_for_selector("#invurl")
        links.append(a.input_value("#invurl"))
        expect(a.locator("main")).to_contain_text(e)
    ok(len(links) == 2 and "#uitnodiging-" in links[0], "uitnodigingslinks gemaakt")

    # ---------- Anna
    cx1, an = page()
    an.goto(links[0])
    an.reload()
    an.wait_for_selector("#inviteform")
    an.fill("#iv-pw", "anna-geheim-12345")
    an.fill("#iv-rep", "anna-geheim-12345")
    an.click("#inviteform button")
    an.wait_for_selector("#nav a")
    ok("Deelnemers" not in an.inner_text("#nav"), "Anna heeft geen beheer-menu")
    an.goto(B + "/#mijn-90")
    an.wait_for_selector("textarea[data-k]")
    first = an.locator("textarea[data-k]").first
    first.fill("Mijn geheime doel van Anna")
    saved(an)
    ok(True, "Anna vult haar doel in en het wordt opgeslagen")
    an.goto(B + "/#week-1")
    an.wait_for_selector("[data-day]")
    an.locator("[data-day]").first.click()
    saved(an)
    an.reload()
    an.wait_for_selector("[data-day]")
    ok(an.locator("[data-day][aria-pressed=true]").count() >= 1, "afgevinkte dag blijft na herladen")
    an.goto(B + "/#mijn-90")
    an.wait_for_selector("textarea[data-k]")
    ok(an.locator("textarea[data-k]").first.input_value() == "Mijn geheime doel van Anna", "tekst blijft bewaard na herladen")
    r = an.evaluate("fetch('/api/admin/participants').then(r=>r.status)")
    ok(r == 403, f"Anna krijgt 403 op admin-API ({r})")
    an.goto(B + "/#beheer")
    an.wait_for_timeout(600)
    ok("#beheer" not in an.url, "Anna wordt weggestuurd van #beheer")

    # ---------- Ben
    cx2, be = page()
    be.goto(links[1])
    be.reload()
    be.wait_for_selector("#inviteform")
    be.fill("#iv-pw", "ben-geheim-1234567")
    be.fill("#iv-rep", "ben-geheim-1234567")
    be.click("#inviteform button")
    be.wait_for_selector("#nav a")
    be.goto(B + "/#mijn-90")
    be.wait_for_selector("textarea[data-k]")
    ok(be.locator("textarea[data-k]").first.input_value() == "", "Ben ziet niets van Anna")
    ok("geheime" not in be.inner_text("body") and "Anna" not in be.inner_text("body"), "Ben ziet naam noch data van Anna")
    be.goto(B + "/#week-1")
    be.wait_for_selector("[data-day]")
    ok(be.locator("[data-day][aria-pressed=true]").count() == 0, "Ben heeft geen afgevinkte dagen")
    aid = a.evaluate("fetch('/api/admin/participants').then(r=>r.json()).then(j=>j.participants.find(p=>p.name==='Anna').id)")
    be.goto(B + f"/#deelnemer-{aid}-start")
    be.wait_for_timeout(800)
    ok("Alleen lezen" not in be.inner_text("body"), "Ben kan Anna's boek niet openen via de URL")

    # ---------- beheerder bekijkt iedereen
    a.click("[data-act=refresh]")
    expect(a.locator("main")).to_contain_text("Mijn geheime doel van Anna", timeout=8000)
    t = a.inner_text("main")
    ok("Anna" in t and "Ben" in t and "Mijn geheime doel van Anna" in t, "admin ziet beide deelnemers met doel")
    a.goto(B + f"/#deelnemer-{aid}-mijn-90")
    a.wait_for_selector(".viewas")
    ta = a.locator("textarea[data-k]").first
    ok(ta.input_value() == "Mijn geheime doel van Anna", "admin ziet Anna's ingevulde boek")
    ok(ta.is_disabled(), "velden zijn alleen-lezen in leesweergave")
    a.goto(B + f"/#deelnemer-{aid}-week-1")
    a.wait_for_selector(".viewas")
    ok(a.locator("[data-day]").first.is_disabled(), "dagknoppen uitgeschakeld in leesweergave")
    ok(a.locator("#nav a").first.get_attribute("href").startswith("#deelnemer-"), "menu blijft binnen Anna's boek")
    a.screenshot(path="/tmp/e2e-admin-view.png")
    a.goto(B + "/#mijn-90")
    a.wait_for_selector("textarea[data-k]")
    ok(a.locator("textarea[data-k]").first.input_value() == "", "admin eigen boek is gescheiden van Anna")

    # ---------- uitloggen en mobiel
    an.click("#lo")
    an.wait_for_selector("#loginform")
    ok(an.evaluate("fetch('/api/me/progress').then(r=>r.status)") == 401, "na uitloggen: 401")
    mctx, m = page(390)
    m.goto(B)
    m.wait_for_selector("#loginform")
    ok(m.evaluate("document.documentElement.scrollWidth<=window.innerWidth"), "login past op 390px")
    m.screenshot(path="/tmp/e2e-login-mobile.png")
    # ---------- installeerbaar (PWA)
    pw = a.evaluate("""fetch('/manifest.json').then(r=>r.json()).then(async m=>{
      const ic=await Promise.all(m.icons.map(i=>fetch(i.src).then(r=>r.status+':'+r.headers.get('content-type'))));
      return {name:m.name,display:m.display,sizes:m.icons.map(i=>i.sizes),ic}})""")
    ok(pw["display"] == "standalone" and all(x == "200:image/png" for x in pw["ic"]), f"manifest en iconen bereikbaar ({pw['sizes']})")
    a.goto(B + "/#start"); a.wait_for_selector("#nav a")
    a.wait_for_timeout(1500)
    ok(a.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r)"), "service worker geregistreerd")
    ok(a.evaluate("caches.keys().then(k=>k.length)") == 0, "niets in de cache bewaard (privacy)")
    br.close()

print("\nFOUTEN:", errs if errs else "geen")
sys.exit(1 if errs else 0)
