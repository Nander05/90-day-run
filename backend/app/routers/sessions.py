from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, iso, utcnow
from ..deps import current_user, require_admin, to_oid

router = APIRouter(prefix="/api")


def _url(v):
    v = (v or "").strip()
    if not v:
        return ""
    p = urlparse(v)
    if p.scheme not in ("http", "https") or not p.netloc or len(v) > 500:
        raise HTTPException(422, "Gebruik een volledige link die met https:// begint.")
    return v


class SessionIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    starts_at: datetime
    week: int | None = Field(default=None, ge=0, le=13)
    join_url: str = Field(default="", max_length=500)
    recording_url: str = Field(default="", max_length=500)
    notes: str = Field(default="", max_length=1000)


def _naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _out(s):
    return {
        "id": str(s["_id"]),
        "title": s.get("title", ""),
        "starts_at": iso(s.get("starts_at")),
        "week": s.get("week"),
        "join_url": s.get("join_url", ""),
        "recording_url": s.get("recording_url", ""),
        "notes": s.get("notes", ""),
    }


def _doc(body: SessionIn):
    return {
        "title": body.title.strip(),
        "starts_at": _naive_utc(body.starts_at),
        "week": body.week,
        "join_url": _url(body.join_url),
        "recording_url": _url(body.recording_url),
        "notes": body.notes.strip(),
    }


@router.get("/sessions")
def list_sessions(_user: dict = Depends(current_user)):
    rows = list(get_db().sessions.find({}).sort("starts_at", 1).limit(300))
    return {"sessions": [_out(s) for s in rows], "now": iso(utcnow())}


admin = APIRouter(prefix="/api/admin/sessions", dependencies=[Depends(require_admin)])


@admin.post("", status_code=201)
def create_session(body: SessionIn):
    res = get_db().sessions.insert_one({**_doc(body), "created_at": utcnow()})
    return {"session": _out(get_db().sessions.find_one({"_id": res.inserted_id}))}


@admin.put("/{sid}")
def update_session(sid: str, body: SessionIn):
    oid = to_oid(sid)
    res = get_db().sessions.update_one({"_id": oid}, {"$set": _doc(body)})
    if not res.matched_count:
        raise HTTPException(404, "Training niet gevonden.")
    return {"session": _out(get_db().sessions.find_one({"_id": oid}))}


@admin.delete("/{sid}")
def delete_session(sid: str):
    res = get_db().sessions.delete_one({"_id": to_oid(sid)})
    if not res.deleted_count:
        raise HTTPException(404, "Training niet gevonden.")
    return {"ok": True}
