import os

os.environ.update(
    USE_MOCK_DB="1",
    APP_ENV="test",
    BCRYPT_ROUNDS="4",
    ADMIN_EMAIL="admin@example.com",
    ADMIN_PASSWORD="admin-wachtwoord-123",
    FRONTEND_DIR="/nonexistent",
)

import pytest
from fastapi.testclient import TestClient

from app import db as dbmod
from app.main import app, bootstrap_admin
from app.security import limiter

H = {"X-Requested-With": "run90"}
PW = "een-goed-wachtwoord"


@pytest.fixture()
def fresh():
    dbmod.reset_for_tests()
    limiter.reset()
    bootstrap_admin()


def client():
    return TestClient(app)


def login(c, email, password):
    return c.post("/api/auth/login", json={"email": email, "password": password}, headers=H)


def admin_client():
    c = client()
    assert login(c, "admin@example.com", "admin-wachtwoord-123").status_code == 200
    return c


def make_member(admin, name="Anna", email="anna@example.com", password=PW):
    r = admin.post("/api/admin/participants", json={"name": name, "email": email}, headers=H)
    assert r.status_code == 201, r.text
    token = r.json()["invite_token"]
    c = client()
    r2 = c.post("/api/auth/accept-invite", json={"token": token, "password": password}, headers=H)
    assert r2.status_code == 200, r2.text
    return c, r.json()["participant"]["id"], token


def test_unauthenticated_is_blocked(fresh):
    c = client()
    assert c.get("/api/me/progress").status_code == 401
    assert c.get("/api/admin/participants").status_code == 401
    assert c.get("/api/auth/me").status_code == 401


def test_login_wrong_password_and_unknown_user(fresh):
    c = client()
    assert login(c, "admin@example.com", "fout-wachtwoord-1").status_code == 401
    assert login(c, "bestaat-niet@example.com", "fout-wachtwoord-1").status_code == 401


def test_writes_need_csrf_header(fresh):
    c = client()
    r = c.post("/api/auth/login", json={"email": "admin@example.com", "password": "admin-wachtwoord-123"})
    assert r.status_code == 403


def test_member_cannot_reach_admin(fresh):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    assert anna.get("/api/admin/participants").status_code == 403
    assert anna.post("/api/admin/participants", json={"name": "X", "email": "x@x.be"}, headers=H).status_code == 403


def test_progress_is_private_per_person(fresh):
    admin = admin_client()
    anna, anna_id, _ = make_member(admin, "Anna", "anna@example.com")
    ben, ben_id, _ = make_member(admin, "Ben", "ben@example.com")
    r = anna.patch("/api/me/progress", json={"set": {"w1|d0": True, "me|doel": "Mijn geheime doel", "w1|1.2.a": "tekst"}}, headers=H)
    assert r.status_code == 200
    # Anna ziet haar eigen data terug, inclusief sleutels met punten
    d = anna.get("/api/me/progress").json()["d"]
    assert d["w1|d0"] is True and d["me|doel"] == "Mijn geheime doel" and d["w1|1.2.a"] == "tekst"
    # Ben ziet niets van Anna
    assert ben.get("/api/me/progress").json()["d"] == {}
    # er is geen route om andermans id op te geven
    assert ben.get(f"/api/admin/participants/{anna_id}/progress").status_code == 403
    assert ben.get(f"/api/me/progress?user_id={anna_id}").json()["d"] == {}


def test_admin_sees_everyone(fresh):
    admin = admin_client()
    anna, anna_id, _ = make_member(admin, "Anna", "anna@example.com")
    anna.patch("/api/me/progress", json={"set": {"w1|d0": True, "w1|d1": True, "w8|d0": True, "w1|done": True, "me|doel": "Groeien"}}, headers=H)
    rows = admin.get("/api/admin/participants").json()["participants"]
    assert len(rows) == 1
    row = rows[0]
    assert row["name"] == "Anna" and row["days"] == 2 and row["weeks_done"] == 1 and row["goal"] == "Groeien"
    full = admin.get(f"/api/admin/participants/{anna_id}/progress").json()
    assert full["d"]["me|doel"] == "Groeien" and full["participant"]["name"] == "Anna"


def test_unset_and_false_remove_keys(fresh):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    anna.patch("/api/me/progress", json={"set": {"w1|d0": True, "w1|win": "iets"}}, headers=H)
    anna.patch("/api/me/progress", json={"set": {"w1|d0": False}, "unset": ["w1|win"]}, headers=H)
    assert anna.get("/api/me/progress").json()["d"] == {}


def test_progress_validation(fresh):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    assert anna.patch("/api/me/progress", json={"set": {"$where": "x"}}, headers=H).status_code == 422
    assert anna.patch("/api/me/progress", json={"set": {"a~b": "x"}}, headers=H).status_code == 422
    assert anna.patch("/api/me/progress", json={"set": {"k": "x" * 4001}}, headers=H).status_code == 422
    assert anna.patch("/api/me/progress", json={"unset": ["bad key"]}, headers=H).status_code == 422
    many = {f"k{i}": "x" for i in range(501)}
    assert anna.patch("/api/me/progress", json={"set": many}, headers=H).status_code == 413


def test_invite_is_single_use_and_expires(fresh):
    admin = admin_client()
    _, _, token = make_member(admin)
    again = client().post("/api/auth/accept-invite", json={"token": token, "password": PW}, headers=H)
    assert again.status_code == 404
    # verlopen link
    r = admin.post("/api/admin/participants", json={"name": "Cas", "email": "cas@example.com"}, headers=H)
    tok = r.json()["invite_token"]
    from app.security import hash_token
    from datetime import timedelta

    dbmod.get_db().invites.update_one({"token_hash": hash_token(tok)}, {"$set": {"expires_at": dbmod.utcnow() - timedelta(minutes=1)}})
    assert client().get(f"/api/auth/invite/{tok}").status_code == 404


def test_invite_needs_strong_password(fresh):
    admin = admin_client()
    r = admin.post("/api/admin/participants", json={"name": "Dina", "email": "dina@example.com"}, headers=H)
    tok = r.json()["invite_token"]
    assert client().post("/api/auth/accept-invite", json={"token": tok, "password": "kort"}, headers=H).status_code == 422
    # een zwak wachtwoord verbruikt de link niet
    assert client().get(f"/api/auth/invite/{tok}").status_code == 200


def test_duplicate_email_rejected(fresh):
    admin = admin_client()
    make_member(admin, "Anna", "anna@example.com")
    r = admin.post("/api/admin/participants", json={"name": "Anna 2", "email": "ANNA@example.com"}, headers=H)
    assert r.status_code == 409


def test_deactivate_kills_session(fresh):
    admin = admin_client()
    anna, anna_id, _ = make_member(admin)
    assert anna.get("/api/me/progress").status_code == 200
    admin.patch(f"/api/admin/participants/{anna_id}", json={"active": False}, headers=H)
    assert anna.get("/api/me/progress").status_code == 401
    assert login(client(), "anna@example.com", PW).status_code == 401
    admin.patch(f"/api/admin/participants/{anna_id}", json={"active": True}, headers=H)
    assert login(client(), "anna@example.com", PW).status_code == 200


def test_delete_participant_removes_data(fresh):
    admin = admin_client()
    anna, anna_id, _ = make_member(admin)
    anna.patch("/api/me/progress", json={"set": {"me|doel": "x"}}, headers=H)
    assert admin.delete(f"/api/admin/participants/{anna_id}", headers=H).status_code == 200
    assert dbmod.get_db().progress.count_documents({}) == 0
    assert admin.get("/api/admin/participants").json()["participants"] == []


def test_new_invite_replaces_old(fresh):
    admin = admin_client()
    _, anna_id, _ = make_member(admin)
    t1 = admin.post(f"/api/admin/participants/{anna_id}/invite", headers=H).json()["invite_token"]
    t2 = admin.post(f"/api/admin/participants/{anna_id}/invite", headers=H).json()["invite_token"]
    assert client().get(f"/api/auth/invite/{t1}").status_code == 404
    assert client().get(f"/api/auth/invite/{t2}").status_code == 200


def test_rate_limit_on_login(fresh):
    c = client()
    for _ in range(8):
        assert login(c, "admin@example.com", "fout-wachtwoord-1").status_code == 401
    assert login(c, "admin@example.com", "admin-wachtwoord-123").status_code == 429


def test_change_password_invalidates_other_sessions(fresh):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    second = client()
    assert login(second, "anna@example.com", PW).status_code == 200
    r = anna.post("/api/me/password", json={"current": PW, "new": "nieuw-wachtwoord-99"}, headers=H)
    assert r.status_code == 200
    assert anna.get("/api/me/progress").status_code == 200  # huidige sessie blijft
    assert second.get("/api/me/progress").status_code == 401  # andere sessie vervalt
    assert login(client(), "anna@example.com", PW).status_code == 401
    assert login(client(), "anna@example.com", "nieuw-wachtwoord-99").status_code == 200


def test_wrong_current_password_rejected(fresh):
    admin = admin_client()
    anna, _, _ = make_member(admin)
    assert anna.post("/api/me/password", json={"current": "fout", "new": "nieuw-wachtwoord-99"}, headers=H).status_code == 403


def test_admin_id_validation(fresh):
    admin = admin_client()
    assert admin.get("/api/admin/participants/niet-een-id/progress").status_code == 404
    assert admin.get("/api/admin/participants/" + "a" * 24 + "/progress").status_code == 404


def test_admin_account_cannot_be_deleted_via_participants(fresh):
    admin = admin_client()
    me = admin.get("/api/auth/me").json()
    assert admin.delete(f"/api/admin/participants/{me['id']}", headers=H).status_code == 404


def test_security_headers(fresh):
    r = client().get("/healthz")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert "frame-ancestors 'none'" in r.headers["content-security-policy"]


def test_start_is_set_once_by_server(fresh):
    admin = admin_client()
    a, aid, _ = make_member(admin)
    assert a.get("/api/me/progress").json()["d"].get("me|start") is None
    r = a.post("/api/me/start", headers=H).json()
    assert r["already"] is False and len(r["start"]) == 10
    r2 = a.post("/api/me/start", headers=H).json()
    assert r2["already"] is True and r2["start"] == r["start"]
    # de deelnemer kan de startdatum niet zelf aanpassen
    assert a.patch("/api/me/progress", json={"set": {"me|start": "2020-01-01"}}, headers=H).status_code == 422
    assert a.patch("/api/me/progress", json={"unset": ["me|start"]}, headers=H).status_code == 422
    assert a.get("/api/me/progress").json()["d"]["me|start"] == r["start"]
    # beheerder ziet de start en kan hem terugzetten
    row = [p for p in admin.get("/api/admin/participants").json()["participants"] if p["id"] == aid][0]
    assert row["start"] == r["start"]
    assert admin.patch(f"/api/admin/participants/{aid}", json={"reset_start": True}, headers=H).status_code == 200
    assert a.get("/api/me/progress").json()["d"].get("me|start") is None


def test_unlock_override_only_by_admin(fresh):
    admin = admin_client()
    a, aid, _ = make_member(admin)
    assert a.get("/api/me/progress").json()["access"]["unlock_to"] is None
    assert a.patch(f"/api/admin/participants/{aid}", json={"unlock_to": 5}, headers=H).status_code == 403
    assert admin.patch(f"/api/admin/participants/{aid}", json={"unlock_to": 5}, headers=H).status_code == 200
    assert a.get("/api/me/progress").json()["access"]["unlock_to"] == 5
    assert admin.patch(f"/api/admin/participants/{aid}", json={"unlock_to": -1}, headers=H).status_code == 200
    assert a.get("/api/me/progress").json()["access"]["unlock_to"] is None


def test_live_sessions(fresh):
    admin = admin_client()
    a, _, _ = make_member(admin)
    body = {"title": "Live training week 1", "starts_at": "2026-11-10T19:00:00+01:00", "week": 1,
            "join_url": "https://zoom.us/j/123", "recording_url": "", "notes": ""}
    assert a.post("/api/admin/sessions", json=body, headers=H).status_code == 403
    assert client().get("/api/sessions").status_code == 401
    r = admin.post("/api/admin/sessions", json=body, headers=H)
    assert r.status_code == 201
    s = r.json()["session"]
    assert s["starts_at"] == "2026-11-10T18:00:00Z"
    # onveilige links worden geweigerd
    bad = {**body, "join_url": "javascript:alert(1)"}
    assert admin.post("/api/admin/sessions", json=bad, headers=H).status_code == 422
    upd = {**body, "recording_url": "https://youtu.be/abc"}
    assert admin.put(f"/api/admin/sessions/{s['id']}", json=upd, headers=H).status_code == 200
    rows = a.get("/api/sessions").json()["sessions"]
    assert len(rows) == 1 and rows[0]["recording_url"] == "https://youtu.be/abc"
    assert a.delete(f"/api/admin/sessions/{s['id']}", headers=H).status_code == 403
    assert admin.delete(f"/api/admin/sessions/{s['id']}", headers=H).status_code == 200
    assert a.get("/api/sessions").json()["sessions"] == []
