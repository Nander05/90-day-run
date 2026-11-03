import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from . import config
from .db import get_db, utcnow
from .routers import admin, auth, progress
from .security import hash_password

CSP = (
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "font-src 'self'; img-src 'self' data:; connect-src 'self'; "
    "frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
)


def bootstrap_admin():
    """Maakt de beheerder aan uit ADMIN_EMAIL en ADMIN_PASSWORD als die er nog niet is."""
    if not (config.ADMIN_EMAIL and config.ADMIN_PASSWORD):
        return
    if len(config.ADMIN_PASSWORD) < config.MIN_PASSWORD:
        raise RuntimeError(f"ADMIN_PASSWORD moet minstens {config.MIN_PASSWORD} tekens zijn.")
    db = get_db()
    if db.users.find_one({"email": config.ADMIN_EMAIL}):
        return
    db.users.insert_one(
        {
            "email": config.ADMIN_EMAIL,
            "name": config.ADMIN_NAME,
            "role": "admin",
            "pw_hash": hash_password(config.ADMIN_PASSWORD),
            "active": True,
            "token_ver": 0,
            "created_at": utcnow(),
            "last_login": None,
        }
    )


@asynccontextmanager
async def lifespan(_app):
    get_db()
    bootstrap_admin()
    yield


app = FastAPI(title="90 Day Run", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


@app.middleware("http")
async def guard(request: Request, call_next):
    path = request.url.path
    unsafe = request.method not in ("GET", "HEAD", "OPTIONS")
    # Extra CSRF-slot bovenop SameSite: schrijfacties vragen een eigen header
    if path.startswith("/api") and unsafe and request.headers.get("x-requested-with") != "run90":
        return JSONResponse({"detail": "Ongeldig verzoek."}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = CSP
    response.headers["Cache-Control"] = "no-store" if path.startswith("/api") else "no-cache"
    if config.IS_PROD:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/healthz")
def healthz():
    if not config.USE_MOCK_DB:
        get_db().command("ping")
    return {"ok": True}


app.include_router(auth.router)
app.include_router(progress.router)
app.include_router(admin.router)

if os.path.isdir(config.FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=config.FRONTEND_DIR, html=True), name="frontend")
