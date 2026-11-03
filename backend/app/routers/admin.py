from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import config
from ..db import get_db, iso, utcnow
from ..deps import public_user, require_admin, to_oid
from ..security import hash_token, new_invite_token
from ..summary import summarize
from .progress import decode_doc

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


class NewParticipant(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)


class ParticipantPatch(BaseModel):
    active: bool | None = None
    name: str | None = Field(default=None, min_length=1, max_length=80)


def _member(oid):
    user = get_db().users.find_one({"_id": oid})
    if not user or user.get("role") != "member":
        raise HTTPException(404, "Deelnemer niet gevonden.")
    return user


def _create_invite(user_id) -> str:
    db = get_db()
    db.invites.delete_many({"user_id": user_id})  # oudere links vervallen
    token = new_invite_token()
    db.invites.insert_one(
        {
            "token_hash": hash_token(token),
            "user_id": user_id,
            "used": False,
            "created_at": utcnow(),
            "expires_at": utcnow() + timedelta(days=config.INVITE_DAYS),
        }
    )
    return token


def _row(user, prog_doc):
    d = decode_doc(prog_doc)
    return {
        **public_user(user),
        "active": user.get("active", True),
        "has_password": bool(user.get("pw_hash")),
        "created_at": iso(user.get("created_at")),
        "last_login": iso(user.get("last_login")),
        "updated_at": iso((prog_doc or {}).get("updated_at")),
        **summarize(d),
    }


@router.get("/participants")
def list_participants():
    db = get_db()
    users = list(db.users.find({"role": "member"}).sort("name", 1))
    progs = {p["user_id"]: p for p in db.progress.find({"user_id": {"$in": [u["_id"] for u in users]}})}
    return {"participants": [_row(u, progs.get(u["_id"])) for u in users]}


@router.post("/participants", status_code=201)
def create_participant(body: NewParticipant):
    email = body.email.strip().lower()
    if "@" not in email or " " in email:
        raise HTTPException(422, "Dat e-mailadres lijkt niet te kloppen.")
    db = get_db()
    if db.users.find_one({"email": email}):
        raise HTTPException(409, "Er bestaat al een account met dit e-mailadres.")
    res = db.users.insert_one(
        {
            "email": email,
            "name": body.name.strip(),
            "role": "member",
            "pw_hash": None,
            "active": True,
            "token_ver": 0,
            "created_at": utcnow(),
            "last_login": None,
        }
    )
    token = _create_invite(res.inserted_id)
    return {"participant": _row(db.users.find_one({"_id": res.inserted_id}), None), "invite_token": token}


@router.post("/participants/{pid}/invite")
def new_invite(pid: str):
    user = _member(to_oid(pid))
    return {"invite_token": _create_invite(user["_id"])}


@router.get("/participants/{pid}/progress")
def participant_progress(pid: str):
    user = _member(to_oid(pid))
    doc = get_db().progress.find_one({"user_id": user["_id"]})
    return {
        "participant": public_user(user),
        "d": decode_doc(doc),
        "updated_at": iso((doc or {}).get("updated_at")),
    }


@router.patch("/participants/{pid}")
def patch_participant(pid: str, body: ParticipantPatch):
    user = _member(to_oid(pid))
    changes = {}
    if body.active is not None:
        changes["active"] = body.active
    if body.name is not None:
        changes["name"] = body.name.strip()
    update = {"$set": changes} if changes else {}
    if body.active is False:
        update["$inc"] = {"token_ver": 1}  # lopende sessies vervallen meteen
    if update:
        get_db().users.update_one({"_id": user["_id"]}, update)
    return {"ok": True}


@router.delete("/participants/{pid}")
def delete_participant(pid: str):
    user = _member(to_oid(pid))
    db = get_db()
    db.progress.delete_many({"user_id": user["_id"]})
    db.invites.delete_many({"user_id": user["_id"]})
    db.users.delete_one({"_id": user["_id"]})
    return {"ok": True}
