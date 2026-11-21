"""Opnames per hoofdstuk, afgespeeld via Cloudflare Stream met korte, getekende links."""
import json
import re
import time
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import config
from ..db import get_db, utcnow
from ..deps import current_user, require_admin, to_oid

UID = re.compile(r"[0-9a-f]{32}")
NAME = re.compile(r"^T(\d{1,2})-(\d{1,2})-(.+?)(?:\.mp4)?$", re.I)
SUB = re.compile(r"^[a-z0-9-]+\.cloudflarestream\.com$")

router = APIRouter(prefix="/api")


def _out(c):
    return {
        "id": str(c["_id"]),
        "training": c.get("training"),
        "order": c.get("order", 0),
        "title": c.get("title", ""),
        "visible": bool(c.get("visible", False)),
    }


def _uid(v: str) -> str:
    m = UID.search((v or "").lower())
    if not m:
        raise HTTPException(422, "Plak de video-ID uit Cloudflare Stream (32 tekens).")
    return m.group(0)


def _cf(method: str, path: str, body=None):
    """Roept de Cloudflare-API aan. Fouten worden nette meldingen, nooit de token zelf."""
    if not (config.CF_ACCOUNT_ID and config.CF_STREAM_TOKEN):
        raise HTTPException(503, "Opnames zijn nog niet gekoppeld aan Cloudflare.")
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{config.CF_ACCOUNT_ID}/stream{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {config.CF_STREAM_TOKEN}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.load(r).get("result")
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise HTTPException(502, "Cloudflare reageert niet. Probeer het zo opnieuw.")


@router.get("/recordings")
def list_recordings(user: dict = Depends(current_user)):
    admin = user.get("role") == "admin"
    q = {} if admin else {"visible": True}
    rows = get_db().chapters.find(q).sort([("training", 1), ("order", 1)])
    return {"recordings": [_out(c) for c in rows], "linked": bool(config.CF_ACCOUNT_ID and config.CF_STREAM_TOKEN and config.CF_STREAM_SUBDOMAIN)}


@router.get("/recordings/{cid}/play")
def play(cid: str, user: dict = Depends(current_user)):
    c = get_db().chapters.find_one({"_id": to_oid(cid)})
    if not c or (user.get("role") != "admin" and not c.get("visible")):
        raise HTTPException(404, "Deze opname staat er niet (meer).")
    if not SUB.match(config.CF_STREAM_SUBDOMAIN):
        raise HTTPException(503, "Opnames zijn nog niet gekoppeld aan Cloudflare.")
    res = _cf("POST", f"/{c['uid']}/token", {"exp": int(time.time()) + 4 * 3600})
    token = (res or {}).get("token")
    if not token:
        raise HTTPException(502, "Cloudflare gaf geen afspeellink.")
    return {"url": f"https://{config.CF_STREAM_SUBDOMAIN}/{token}/iframe"}


class ChapterIn(BaseModel):
    training: int = Field(ge=1, le=12)
    order: int = Field(default=1, ge=0, le=99)
    title: str = Field(min_length=1, max_length=120)
    video: str = Field(default="", max_length=300)  # video-ID (of een link waar het ID in staat)
    visible: bool = False


admin = APIRouter(prefix="/api/admin/recordings", dependencies=[Depends(require_admin)])


@admin.post("", status_code=201)
def create(body: ChapterIn):
    doc = {"training": body.training, "order": body.order, "title": body.title.strip(), "uid": _uid(body.video), "visible": body.visible, "created_at": utcnow()}
    res = get_db().chapters.insert_one(doc)
    return {"recording": _out(get_db().chapters.find_one({"_id": res.inserted_id}))}


class ChapterPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    order: int | None = Field(default=None, ge=0, le=99)
    training: int | None = Field(default=None, ge=1, le=12)
    visible: bool | None = None


@admin.patch("/{cid}")
def patch(cid: str, body: ChapterPatch):
    oid = to_oid(cid)
    upd = {k: (v.strip() if isinstance(v, str) else v) for k, v in body.model_dump().items() if v is not None}
    if upd:
        res = get_db().chapters.update_one({"_id": oid}, {"$set": upd})
        if not res.matched_count:
            raise HTTPException(404, "Hoofdstuk niet gevonden.")
    c = get_db().chapters.find_one({"_id": oid})
    if not c:
        raise HTTPException(404, "Hoofdstuk niet gevonden.")
    return {"recording": _out(c)}


@admin.delete("/{cid}")
def delete(cid: str):
    if not get_db().chapters.delete_one({"_id": to_oid(cid)}).deleted_count:
        raise HTTPException(404, "Hoofdstuk niet gevonden.")
    return {"ok": True}


@admin.post("/import")
def import_from_cloudflare():
    """Zet video's met een naam als T2-03-eerst-rust-dan-techniek.mp4 als verborgen hoofdstuk klaar en
    zet 'alleen met getekende link' aan, zodat niemand ze buiten de app kan openen."""
    db = get_db()
    known = {c["uid"] for c in db.chapters.find({}, {"uid": 1})}
    added = skipped = unsigned = 0
    for v in _cf("GET", "?limit=1000") or []:
        m = NAME.match(((v.get("meta") or {}).get("name") or "").strip())
        uid = v.get("uid", "")
        if not m or not UID.fullmatch(uid) or uid in known:
            skipped += 1
            continue
        if not v.get("requireSignedURLs"):
            try:
                _cf("POST", f"/{uid}", {"requireSignedURLs": True})
            except HTTPException:
                unsigned += 1
        title = m.group(3).replace("-", " ").replace("_", " ").strip().capitalize()
        db.chapters.insert_one({"training": int(m.group(1)), "order": int(m.group(2)), "title": title, "uid": uid, "visible": False, "created_at": utcnow()})
        added += 1
    return {"added": added, "skipped": skipped, "unsigned": unsigned}
