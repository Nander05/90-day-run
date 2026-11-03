"""Bouwt frontend/ uit tools/src (app.html + course.json) + state.js + tail.js. Gebruik: python3 tools/build.py"""
import sys, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "tools/src/app.html").read_text().split("\n")
course = (root / "tools/src/course.json").read_text().strip()
out = root / "frontend"; out.mkdir(exist_ok=True)

def L(a, b): return "\n".join(src[a-1:b])   # 1-gebaseerd, inclusief

css = L(5, 155)
extra = """
[hidden]{display:none!important}
/* --- login, beheer, alleen-lezen --- */
.auth{max-width:420px;margin:8vh auto 0;display:flex;flex-direction:column;gap:20px}
.err{color:var(--accent);margin:0;min-height:1.2em;font-size:.92rem}
.small{font-size:.85rem}
.viewas{display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;background:var(--soft);border:1px solid var(--accent);padding:10px 14px;margin-bottom:24px}
.viewas>*{min-width:0}
.card{background:var(--surface);border:1px solid var(--line);padding:16px;display:flex;flex-direction:column;gap:10px}
.pcard{gap:12px}.linkbox{border-color:var(--accent)}
.btn.sm{padding:6px 12px;font-size:.88rem}
.cols2{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.pill.on{background:var(--accent);color:var(--accent-ink)}
#sv{font-size:.8rem;color:var(--muted);min-width:5.5em;text-align:right}
.bar{gap:12px}
#lo{white-space:nowrap}
body.anon .hp,body.anon .nav{display:none}
input[disabled],textarea[disabled],select[disabled]{opacity:.85;cursor:not-allowed}
.chk input[disabled]+.box{cursor:not-allowed}
"""
(out/"styles.css").write_text(css + extra)

js = L(172, 289)                       # na `const C = ...` t/m voor '/* ---- state ---- */'
head = L(170, 171).replace("<script>", "").replace("/*COURSE*/null", "window.COURSE")
state = (root/"tools/state.js").read_text()
rest = L(297, 461)                     # helpers t/m vMateriaal, voor '/* ---- router ---- */'
# back-up sectie -> account sectie
rest = re.sub(r'<section class="sec"><div class="sechead"><h2>Back-up</h2></div>.*?<div id="bkout"></div></section>', '${accountHtml()}', rest, flags=re.S)
assert "bkout" not in rest and "accountHtml" in rest
tail = (root/"tools/tail.js").read_text()
app = head + "\n" + js + "\n" + state + "\n" + rest + "\n" + tail
assert "localStorage" not in app and "bindBackup" not in app and "persist" not in app, "oude opslag nog aanwezig"
(out/"app.js").write_text("'use strict';\n" + app.lstrip())
(out/"course.js").write_text("window.COURSE = " + course + ";\n")

(out/"index.html").write_text("""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>90 Day Run</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=IBM+Plex+Mono:wght@500&family=Public+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="anon">
<div class="wrap">
  <header class="top">
    <div class="bar">
      <a class="brand" href="#start">90 Day <b>Run</b></a>
      <div class="hp"><span class="mono" id="hpl"></span><div class="track"><i id="hpb"></i></div></div>
      <span id="sv" role="status" aria-live="polite"></span>
      <button class="btn ghost sm" id="lo" type="button" hidden>Uitloggen</button>
    </div>
    <nav class="nav" id="nav" aria-label="Hoofdmenu"></nav>
  </header>
  <main id="app"><p class="muted">Laden…</p></main>
</div>
<script src="/course.js"></script>
<script src="/app.js"></script>
</body>
</html>
""")
print("ok", {p.name: p.stat().st_size for p in out.iterdir()})
