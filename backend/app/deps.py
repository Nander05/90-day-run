from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, Request, Response

from . import config
from .db import get_db
from .security import read_session_token


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        config.COOKIE_NAME,
        token,
        max_age=config.SESSION_DAYS * 86400,
        httponly=True,
        secure=config.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response):
    response.delete_cookie(config.COOKIE_NAME, path="/")


def client_ip(request: Request) -> str:
    if config.TRUST_PROXY:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "onbekend"


def to_oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(404, "Niet gevonden.")


def current_user(request: Request) -> dict:
    token = request.cookies.get(config.COOKIE_NAME)
    payload = read_session_token(token) if token else None
    if not payload:
        raise HTTPException(401, "Niet ingelogd.")
    try:
        oid = ObjectId(payload["sub"])
    except (InvalidId, KeyError, TypeError):
        raise HTTPException(401, "Niet ingelogd.")
    user = get_db().users.find_one({"_id": oid})
    if (
        not user
        or not user.get("active", True)
        or not user.get("pw_hash")
        or user.get("token_ver", 0) != payload.get("ver")
    ):
        raise HTTPException(401, "Niet ingelogd.")
    return user


def require_admin(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Alleen voor de beheerder.")
    return user


def public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "member"),
    }
