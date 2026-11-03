from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from .. import config
from ..db import get_db, utcnow
from ..deps import (
    client_ip,
    clear_session_cookie,
    current_user,
    public_user,
    set_session_cookie,
)
from ..security import (
    dummy_hash,
    hash_password,
    hash_token,
    limiter,
    make_session_token,
    verify_password,
)

router = APIRouter(prefix="/api")


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)


class AcceptIn(BaseModel):
    token: str = Field(max_length=200)
    password: str = Field(max_length=200)


class PasswordIn(BaseModel):
    current: str = Field(max_length=200)
    new: str = Field(max_length=200)


def _check_password(password: str):
    if len(password) < config.MIN_PASSWORD:
        raise HTTPException(422, f"Kies een wachtwoord van minstens {config.MIN_PASSWORD} tekens.")


@router.post("/auth/login")
def login(body: LoginIn, request: Request, response: Response):
    ip, email = client_ip(request), body.email.strip().lower()
    keys = (f"ip:{ip}", f"acc:{email}")
    if limiter.blocked(*keys):
        raise HTTPException(429, "Te veel pogingen. Probeer het over een kwartier opnieuw.")
    db = get_db()
    user = db.users.find_one({"email": email})
    stored = user.get("pw_hash") if user else None
    password_ok = verify_password(body.password, stored or dummy_hash())  # altijd rekenen
    if not (user and stored and password_ok and user.get("active", True)):
        limiter.fail(*keys)
        raise HTTPException(401, "Onjuiste combinatie van e-mail en wachtwoord.")
    limiter.clear(f"acc:{email}")
    db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": utcnow()}})
    set_session_cookie(response, make_session_token(str(user["_id"]), user.get("token_ver", 0)))
    return public_user(user)


@router.post("/auth/logout")
def logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/auth/me")
def me(user: dict = Depends(current_user)):
    return public_user(user)


def _valid_invite_filter(token: str) -> dict:
    return {"token_hash": hash_token(token), "used": False, "expires_at": {"$gt": utcnow()}}


@router.get("/auth/invite/{token}")
def invite_info(token: str, request: Request):
    ip = client_ip(request)
    if limiter.blocked(f"inv:{ip}"):
        raise HTTPException(429, "Te veel pogingen. Probeer het later opnieuw.")
    db = get_db()
    inv = db.invites.find_one(_valid_invite_filter(token))
    if not inv:
        limiter.fail(f"inv:{ip}")
        raise HTTPException(404, "Deze link is niet meer geldig. Vraag Nander om een nieuwe.")
    user = db.users.find_one({"_id": inv["user_id"]})
    return {"name": user.get("name", ""), "email": user.get("email", "")}


@router.post("/auth/accept-invite")
def accept_invite(body: AcceptIn, request: Request, response: Response):
    ip = client_ip(request)
    if limiter.blocked(f"inv:{ip}"):
        raise HTTPException(429, "Te veel pogingen. Probeer het later opnieuw.")
    _check_password(body.password)
    db = get_db()
    # Eén keer bruikbaar: de uitnodiging wordt atomair geclaimd
    inv = db.invites.find_one_and_update(_valid_invite_filter(body.token), {"$set": {"used": True}})
    if not inv:
        limiter.fail(f"inv:{ip}")
        raise HTTPException(404, "Deze link is niet meer geldig. Vraag Nander om een nieuwe.")
    user = db.users.find_one_and_update(
        {"_id": inv["user_id"]},
        {
            "$set": {"pw_hash": hash_password(body.password), "active": True, "last_login": utcnow()},
            "$inc": {"token_ver": 1},
        },
        return_document=True,
    )
    set_session_cookie(response, make_session_token(str(user["_id"]), user.get("token_ver", 0)))
    return public_user(user)


@router.post("/me/password")
def change_password(body: PasswordIn, response: Response, user: dict = Depends(current_user)):
    if not verify_password(body.current, user["pw_hash"]):
        raise HTTPException(403, "Je huidige wachtwoord klopt niet.")
    _check_password(body.new)
    db = get_db()
    updated = db.users.find_one_and_update(
        {"_id": user["_id"]},
        {"$set": {"pw_hash": hash_password(body.new)}, "$inc": {"token_ver": 1}},
        return_document=True,
    )
    # andere sessies vervallen, deze blijft geldig
    set_session_cookie(response, make_session_token(str(updated["_id"]), updated.get("token_ver", 0)))
    return {"ok": True}
