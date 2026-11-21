from test_api import H, admin_client, client, fresh, make_member  # noqa: F401

from app import config
from app.routers import recordings

PDF = b"%PDF-1.4\n" + b"x" * 5_000_000  # groter dan één blok, test het opdelen
UID = "a" * 32


def test_files_private_and_hidden_until_visible(fresh):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    assert client().get("/api/files").status_code == 401
    assert client().get("/api/files/werkboek").status_code == 401
    assert anna.put("/api/admin/files/werkboek", content=PDF, headers=H).status_code == 403
    assert admin.put("/api/admin/files/nope", content=PDF, headers=H).status_code == 404
    assert admin.put("/api/admin/files/werkboek", content=b"geen pdf", headers=H).status_code == 422
    r = admin.put("/api/admin/files/werkboek", content=PDF, headers=H)
    assert r.status_code == 200 and r.json()["file"]["visible"] is False
    # verborgen: deelnemer ziet niets, beheerder wel
    assert anna.get("/api/files").json()["files"] == []
    assert anna.get("/api/files/werkboek").status_code == 404
    assert admin.get("/api/files/werkboek").content == PDF
    assert admin.patch("/api/admin/files/werkboek", json={"visible": True}, headers=H).status_code == 200
    assert [f["key"] for f in anna.get("/api/files").json()["files"]] == ["werkboek"]
    got = anna.get("/api/files/werkboek")
    assert got.status_code == 200 and got.content == PDF and got.headers["content-type"] == "application/pdf"
    # opnieuw uploaden behoudt de zichtbaarheid en laat geen oude blokken achter
    admin.put("/api/admin/files/werkboek", content=b"%PDF-nieuw", headers=H)
    assert anna.get("/api/files/werkboek").content == b"%PDF-nieuw"
    assert admin.delete("/api/admin/files/werkboek", headers=H).status_code == 200
    assert anna.get("/api/files/werkboek").status_code == 404


def test_recordings_visibility_and_signed_play(fresh, monkeypatch):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    body = {"training": 2, "order": 3, "title": "Eerst rust, dan techniek", "video": UID}
    assert anna.post("/api/admin/recordings", json=body, headers=H).status_code == 403
    assert admin.post("/api/admin/recordings", json={**body, "video": "kapot"}, headers=H).status_code == 422
    cid = admin.post("/api/admin/recordings", json=body, headers=H).json()["recording"]["id"]
    assert anna.get("/api/recordings").json()["recordings"] == []
    assert anna.get(f"/api/recordings/{cid}/play").status_code == 404
    admin.patch(f"/api/admin/recordings/{cid}", json={"visible": True}, headers=H)
    rows = anna.get("/api/recordings").json()["recordings"]
    assert rows[0]["title"] == "Eerst rust, dan techniek" and "uid" not in rows[0]
    # zonder Cloudflare-koppeling: nette melding, geen crash
    assert anna.get(f"/api/recordings/{cid}/play").status_code == 503
    monkeypatch.setattr(config, "CF_STREAM_SUBDOMAIN", "customer-abc123.cloudflarestream.com")
    calls = []
    monkeypatch.setattr(recordings, "_cf", lambda m, p, b=None: calls.append((m, p)) or {"token": "TOKEN"})
    r = anna.get(f"/api/recordings/{cid}/play")
    assert r.json()["url"] == "https://customer-abc123.cloudflarestream.com/TOKEN/iframe"
    assert calls == [("POST", f"/{UID}/token")]


def test_import_from_cloudflare_hidden_and_signed(fresh, monkeypatch):
    admin = admin_client()
    vids = [
        {"uid": "b" * 32, "meta": {"name": "T2-03-eerst-rust-dan-techniek.mp4"}, "requireSignedURLs": False},
        {"uid": "c" * 32, "meta": {"name": "iets-anders.mp4"}},
    ]
    seen = []

    def fake(method, path, body=None):
        seen.append((method, path, body))
        return vids if method == "GET" else {}

    monkeypatch.setattr(recordings, "_cf", fake)
    assert admin.post("/api/admin/recordings/import", headers=H).json() == {"added": 1, "skipped": 1, "unsigned": 0}
    assert ("POST", "/" + "b" * 32, {"requireSignedURLs": True}) in seen
    row = admin.get("/api/recordings").json()["recordings"][0]
    assert (row["training"], row["order"], row["title"], row["visible"]) == (2, 3, "Eerst rust dan techniek", False)
    assert admin.post("/api/admin/recordings/import", headers=H).json()["added"] == 0  # geen dubbelen


def test_import_pdf_from_link(fresh, monkeypatch):
    from app.routers import files

    admin = admin_client()
    anna, _, _ = make_member(admin)
    body = {"key": "cursusboek", "url": "https://voorbeeld.example/x.pdf"}
    assert anna.post("/api/admin/files/import", json=body, headers=H).status_code == 403
    # interne en niet-https adressen worden geweigerd
    for bad in ("http://voorbeeld.example/x.pdf", "https://127.0.0.1/x.pdf", "https://localhost/x.pdf"):
        r = admin.post("/api/admin/files/import", json={"key": "cursusboek", "url": bad}, headers=H)
        assert r.status_code == 422, bad
    assert admin.post("/api/admin/files/import", json={"key": "nope", "url": body["url"]}, headers=H).status_code == 404
    monkeypatch.setattr(files, "fetch_pdf", lambda url: PDF)
    r = admin.post("/api/admin/files/import", json=body, headers=H)
    assert r.status_code == 200 and r.json()["file"]["visible"] is False
    assert admin.get("/api/files/cursusboek").content == PDF


def test_toggle_whole_training(fresh):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    db = recordings.get_db()
    for n, (t, o) in enumerate([(2, 1), (2, 2), (1, 1)]):
        db.chapters.insert_one({"training": t, "order": o, "title": f"h{n}", "uid": UID, "visible": False})
    assert anna.patch("/api/admin/recordings/training/2", json={"visible": True}, headers=H).status_code == 403
    assert admin.patch("/api/admin/recordings/training/9", json={"visible": True}, headers=H).status_code == 404
    assert admin.patch("/api/admin/recordings/training/2", json={"visible": True}, headers=H).json() == {"changed": 2}
    seen = {(r["training"], r["order"]) for r in anna.get("/api/recordings").json()["recordings"]}
    assert seen == {(2, 1), (2, 2)}
