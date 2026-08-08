"""Rate limiter dependency using Redis token bucket with in-memory fallback."""

import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.services.redis_service import redis_service
from app.config import settings

# In-memory fallback tracking: { "ip:minute": count }
_memory_counters: dict[str, int] = defaultdict(int)

async def rate_limit(request: Request):
    """
    Rate limiting dependency using a fixed-window counter in Redis,
    falling back to in-memory windowing if Redis is offline.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    current_minute = int(time.time() // 60)
    key = f"rate_limit:{client_ip}:{current_minute}"

    try:
        if not redis_service.redis:
            await redis_service.connect()

        current_count = await redis_service.redis.get(key)

        if current_count and int(current_count) >= settings.rate_limit_per_min:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded ({settings.rate_limit_per_min} req/min). Please try again in a minute.",
            )

        async with redis_service.redis.pipeline() as pipe:
            pipe.incr(key)
            pipe.expire(key, 60)
            await pipe.execute()
        return True

    except HTTPException:
        raise
    except Exception as e:
        # Fallback to in-memory tracking if Redis is offline/unavailable
        _memory_counters[key] += 1
        limit = max(settings.rate_limit_per_min, 60)
        if _memory_counters[key] > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again in a minute.",
            )
        # Periodically prune stale keys
        if len(_memory_counters) > 1000:
            _memory_counters.clear()
        return True
