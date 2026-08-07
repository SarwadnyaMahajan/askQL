"""Redis client setup for caching and rate limiting."""

import redis.asyncio as redis
import json
from typing import Any, Optional
from app.config import settings


class RedisService:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis."""
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)

    async def close(self):
        """Close connection."""
        if self.redis:
            await self.redis.close()

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis."""
        if not self.redis:
            await self.connect()
        val = await self.redis.get(key)
        if val:
            try:
                return json.loads(val)
            except json.JSONDecodeError:
                return val
        return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        """Set value in Redis with expiration in seconds."""
        if not self.redis:
            await self.connect()
        val_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        await self.redis.set(key, val_str, ex=expire)


redis_service = RedisService()
