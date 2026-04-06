"""
Shared MongoDB connection module.
All route files import 'db' from here instead of creating their own AsyncIOMotorClient.
This ensures a single connection pool is used across the application.
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os

_client = None
_db = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        mongo_url = os.environ['MONGO_URL']
        _client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=30000,
        )
    return _client


def get_db():
    global _db
    if _db is None:
        client = get_client()
        _db = client[os.environ['DB_NAME']]
    return _db


# Convenience: module-level db reference (matches existing usage pattern)
class _LazyDB:
    """Lazy proxy that resolves the db on first attribute access."""
    def __getattr__(self, name):
        return getattr(get_db(), name)

    def __getitem__(self, key):
        return get_db()[key]


db = _LazyDB()
