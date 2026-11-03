import base64
import hashlib
import secrets
import threading
import time
from collections import defaultdict, deque

import bcrypt
import jwt

from . import config


def _prep(password: str) -> bytes:
    # sha256 + base64 omzeilt de limiet van 72 bytes in bcrypt
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prep(password), bcrypt.gensalt(rounds=config.BCRYPT_ROUNDS)).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prep(password), hashed.encode())
    except Exception:
        return False


_DUMMY = None


def dummy_hash() -> str:
    """Vaste nep-hash, zodat een login met een onbekend adres even lang duurt als een echte."""
    global _DUMMY
    if _DUMMY is None:
        _DUMMY = hash_password(secrets.token_urlsafe(12))
    return _DUMMY


def make_session_token(user_id: str, ver: int) -> str:
    now = int(time.time())
    payload = {"sub": user_id, "ver": ver, "iat": now, "exp": now + config.SESSION_DAYS * 86400}
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def read_session_token(token: str):
    try:
        return jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def new_invite_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class RateLimiter:
    """Eenvoudige begrenzing van mislukte pogingen, per proces. Voor meerdere servers: Redis."""

    def __init__(self, limit=8, window=15 * 60):
        self.limit, self.window = limit, window
        self.hits = defaultdict(deque)
        self.lock = threading.Lock()

    def _clean(self, key, now):
        q = self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        return q

    def blocked(self, *keys) -> bool:
        now = time.time()
        with self.lock:
            return any(len(self._clean(k, now)) >= self.limit for k in keys)

    def fail(self, *keys):
        now = time.time()
        with self.lock:
            for k in keys:
                self._clean(k, now).append(now)

    def clear(self, *keys):
        with self.lock:
            for k in keys:
                self.hits.pop(k, None)

    def reset(self):
        with self.lock:
            self.hits.clear()


limiter = RateLimiter()
