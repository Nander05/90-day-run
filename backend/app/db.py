from datetime import datetime, timezone

from . import config

_db = None


def utcnow() -> datetime:
    """Naieve UTC-tijd, zodat opslag en vergelijkingen overal hetzelfde werken."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(dt):
    return dt.isoformat() + "Z" if dt else None


def _client():
    if config.USE_MOCK_DB:
        import mongomock

        return mongomock.MongoClient()
    from pymongo import MongoClient

    return MongoClient(config.MONGO_URL, serverSelectionTimeoutMS=8000)


def get_db():
    global _db
    if _db is None:
        _db = _client()[config.DB_NAME]
        init_indexes(_db)
    return _db


def init_indexes(db):
    db.users.create_index("email", unique=True)
    db.invites.create_index("token_hash", unique=True)
    db.invites.create_index("expires_at", expireAfterSeconds=0)
    db.progress.create_index("user_id", unique=True)


def reset_for_tests():
    global _db
    _db = None
    return get_db()
