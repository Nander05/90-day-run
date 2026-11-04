import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Dict, List, Union

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, iso, utcnow
from ..deps import current_user

router = APIRouter(prefix="/api")

KEY_RE = re.compile(r"^[A-Za-z0-9|._-]{1,80}$")
MAX_VALUE_LEN = 4000
MAX_KEYS_PER_REQUEST = 500
MAX_KEYS_PER_USER = 5000


def enc(key: str) -> str:
    """Mongo gebruikt punten in veldnamen als pad; daarom een punt als ~ opslaan."""
    return key.replace(".", "~")


def dec(key: str) -> str:
    return key.replace("~", ".")


def decode_doc(doc) -> dict:
    return {dec(k): v for k, v in ((doc or {}).get("d") or {}).items()}


class ProgressPatch(BaseModel):
    set: Dict[str, Union[bool, int, float, str]] = Field(default_factory=dict)
    unset: List[str] = Field(default_factory=list)


RESERVED = {"me|start"}  # alleen de server zet dit (zie /me/start)


def today_local() -> str:
    return datetime.now(timezone.utc).astimezone(ZoneInfo("Europe/Brussels")).date().isoformat()


@router.get("/me/progress")
def get_progress(user: dict = Depends(current_user)):
    doc = get_db().progress.find_one({"user_id": user["_id"]})
    return {
        "d": decode_doc(doc),
        "updated_at": iso((doc or {}).get("updated_at")),
        "access": {"unlock_to": user.get("unlock_to")},
    }


@router.post("/me/start")
def start_run(user: dict = Depends(current_user)):
    """Dag 1 begint op het moment dat de deelnemer zelf start. Eén keer, door de server bepaald."""
    db = get_db()
    existing = db.progress.find_one({"user_id": user["_id"]}, {"d": 1}) or {}
    cur = (existing.get("d") or {}).get("me|start")
    if cur:
        return {"start": cur, "already": True}
    day = today_local()
    db.progress.update_one(
        {"user_id": user["_id"]}, {"$set": {"d.me|start": day, "updated_at": utcnow()}}, upsert=True
    )
    return {"start": day, "already": False}


@router.patch("/me/progress")
def patch_progress(body: ProgressPatch, user: dict = Depends(current_user)):
    if len(body.set) + len(body.unset) > MAX_KEYS_PER_REQUEST:
        raise HTTPException(413, "Te veel wijzigingen in één keer.")
    to_set = {}
    for key, val in body.set.items():
        if not KEY_RE.match(key) or key in RESERVED:
            raise HTTPException(422, "Ongeldige sleutel.")
        if isinstance(val, str) and len(val) > MAX_VALUE_LEN:
            raise HTTPException(422, "Tekst is te lang.")
        if isinstance(val, bool) and val is False:
            continue  # niet aangevinkt = niets bewaren
        to_set[key] = val
    to_unset = []
    for key in body.unset:
        if not KEY_RE.match(key) or key in RESERVED:
            raise HTTPException(422, "Ongeldige sleutel.")
        if key not in to_set:
            to_unset.append(key)
    # sleutels die vervallen zijn horen ook niet meer in $set
    for key, val in body.set.items():
        if val is False and key not in to_unset:
            to_unset.append(key)

    db = get_db()
    existing = db.progress.find_one({"user_id": user["_id"]}, {"d": 1})
    count = len((existing or {}).get("d") or {})
    if count + len(to_set) > MAX_KEYS_PER_USER:
        raise HTTPException(413, "Er staan al te veel gegevens in je boek.")

    update = {"$set": {"updated_at": utcnow()}}
    for key, val in to_set.items():
        update["$set"]["d." + enc(key)] = val
    if to_unset:
        update["$unset"] = {"d." + enc(k): "" for k in to_unset}
    db.progress.update_one({"user_id": user["_id"]}, update, upsert=True)
    return {"ok": True}
