"""Privé-bestanden (PDF's uit Canva): opgeslagen in de database, alleen zichtbaar na inloggen."""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from ..db import get_db, iso, utcnow
from ..deps import current_user, require_admin

MAX_BYTES = 40 * 1024 * 1024
CHUNK = 4 * 1024 * 1024  # ruim onder de 16 MB-grens van één MongoDB-document

LABELS = {
    "cursusboek": "Cursusboek · de theorie",
    "werkboek": "Werkboek · papieren versie",
    "deck-bonus": "Bonus · het brand partner-gesprek",
    **{f"deck-{i}": f"Training {i:02d} · presentatie" for i in range(1, 13)},
}

router = APIRouter(prefix="/api")


def _slot(key: str) -> str:
    if key not in LABELS:
        raise HTTPException(404, "Onbekend bestand.")
    return key


def _out(m):
    return {
        "key": m["_id"],
        "label": LABELS[m["_id"]],
        "size": m.get("size", 0),
        "updated_at": iso(m.get("updated_at")),
        "visible": bool(m.get("visible", True)),
    }


@router.get("/files")
def list_files(user: dict = Depends(current_user)):
    admin = user.get("role") == "admin"
    rows = [m for m in get_db().files.find({}) if m["_id"] in LABELS and (admin or m.get("visible", True))]
    return {"files": [_out(m) for m in rows], "slots": [{"key": k, "label": v} for k, v in LABELS.items()] if admin else []}


@router.get("/files/{key}")
def get_file(key: str, user: dict = Depends(current_user)):
    db = get_db()
    m = db.files.find_one({"_id": _slot(key)})
    if not m or (user.get("role") != "admin" and not m.get("visible", True)):
        raise HTTPException(404, "Dit bestand staat er niet (meer).")
    data = b"".join(c["data"] for c in db.file_chunks.find({"file": key, "ver": m["ver"]}).sort("n", 1))
    return Response(
        data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{key}.pdf"', "Cache-Control": "private, no-store"},
    )


admin = APIRouter(prefix="/api/admin/files", dependencies=[Depends(require_admin)])


@admin.put("/{key}")
async def upload(key: str, request: Request):
    _slot(key)
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_BYTES:
        raise HTTPException(413, "Het bestand is te groot (maximaal 40 MB).")
    data = await request.body()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Het bestand is te groot (maximaal 40 MB).")
    if not data.startswith(b"%PDF"):
        raise HTTPException(422, "Dit is geen PDF-bestand.")
    db = get_db()
    old = db.files.find_one({"_id": key})
    ver = utcnow().isoformat()
    for n, i in enumerate(range(0, len(data), CHUNK)):
        db.file_chunks.insert_one({"file": key, "ver": ver, "n": n, "data": data[i : i + CHUNK]})
    db.files.update_one(
        {"_id": key},
        {"$set": {"ver": ver, "size": len(data), "updated_at": utcnow(), "visible": old.get("visible", True) if old else False}},
        upsert=True,
    )
    db.file_chunks.delete_many({"file": key, "ver": {"$ne": ver}})
    return {"file": _out(db.files.find_one({"_id": key}))}


class Patch(BaseModel):
    visible: bool


@admin.patch("/{key}")
def patch(key: str, body: Patch):
    res = get_db().files.update_one({"_id": _slot(key)}, {"$set": {"visible": body.visible}})
    if not res.matched_count:
        raise HTTPException(404, "Upload eerst een bestand.")
    return {"file": _out(get_db().files.find_one({"_id": key}))}


@admin.delete("/{key}")
def delete(key: str):
    db = get_db()
    _slot(key)
    db.files.delete_one({"_id": key})
    db.file_chunks.delete_many({"file": key})
    return {"ok": True}
