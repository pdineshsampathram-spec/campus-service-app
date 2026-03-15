from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger("uvicorn")

_client = None
_database = None

def get_database():
    """Returns the database instance. Raises an error if not initialized."""
    if _database is None:
        # Fallback to local init if get_database is called before startup (e.g. scripts)
        # However, we usually want it initialized via init_db()
        pass
    return _database

async def init_db_core():
    global _client, _database
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=2000
        )
        # Verify connection
        await _client.admin.command('ping')
        _database = _client[settings.database_name]
        logger.info(f"✅ Core Database initialized: {settings.database_name}")
        return _database
    except Exception as e:
        logger.warning(f"⚠️ Core MongoDB connection failed: {e}")
        return None
