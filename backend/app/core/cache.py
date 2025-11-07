import redis.asyncio as redis
from app.core.config import settings

class RedisCache:
    def __init__(self):
        self.redis_client = None
    
    async def connect(self):
        """Connect to Redis."""
        self.redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis_client:
            await self.redis_client.close()
    
    async def get(self, key: str):
        """Get value from cache."""
        if not self.redis_client:
            await self.connect()
        return await self.redis_client.get(key)
    
    async def set(self, key: str, value: str, ttl: int = None):
        """Set value in cache with optional TTL."""
        if not self.redis_client:
            await self.connect()
        if ttl:
            await self.redis_client.setex(key, ttl, value)
        else:
            await self.redis_client.set(key, value)
    
    async def delete(self, key: str):
        """Delete value from cache."""
        if not self.redis_client:
            await self.connect()
        await self.redis_client.delete(key)
    
    async def invalidate_menu_cache(self):
        """Invalidate menu cache."""
        await self.delete(settings.REDIS_MENU_CACHE_KEY)

cache = RedisCache()
