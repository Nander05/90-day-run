import os
import secrets

ENV = os.getenv("APP_ENV", "development")  # "production" op de server
IS_PROD = ENV == "production"

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "run90")
USE_MOCK_DB = os.getenv("USE_MOCK_DB") == "1"  # alleen voor tests en lokaal proberen

JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    if IS_PROD:
        raise RuntimeError("JWT_SECRET ontbreekt. Genereer er een met: python -c \"import secrets;print(secrets.token_urlsafe(48))\"")
    JWT_SECRET = secrets.token_urlsafe(48)  # alleen lokaal: sessies vervallen bij herstart
if IS_PROD and len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET is te kort (minimaal 32 tekens).")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Nander")

SESSION_DAYS = int(os.getenv("SESSION_DAYS", "14"))
INVITE_DAYS = int(os.getenv("INVITE_DAYS", "14"))
COOKIE_NAME = "run90_session"
COOKIE_SECURE = IS_PROD
TRUST_PROXY = os.getenv("TRUST_PROXY", "1" if IS_PROD else "0") == "1"
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

MIN_PASSWORD = 10
FRONTEND_DIR = os.getenv(
    "FRONTEND_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend"),
)
